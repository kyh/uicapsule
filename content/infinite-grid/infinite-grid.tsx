import { useEffect, useRef, useState } from "react";
import type {
  Dispatch,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  SetStateAction,
  TouchEvent as ReactTouchEvent,
} from "react";
// Grid physics constants
const MIN_VELOCITY = 0.2;
const UPDATE_INTERVAL = 16;
const VELOCITY_HISTORY_SIZE = 5;
const FRICTION = 0.9;
const VELOCITY_THRESHOLD = 0.3;
// Distance (px) the grid must sit away from its rest position to count as "moving".
const MOVING_DISTANCE = 5;
// Idle time (ms) after the last update before the grid settles back to rest.
const REST_DELAY = 200;

// Custom debounce implementation
const debounce = (func: () => void, wait: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const debouncedFn = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func();
      timeoutId = undefined;
    }, wait);
  };

  debouncedFn.cancel = () => {
    clearTimeout(timeoutId);
    timeoutId = undefined;
  };

  return debouncedFn;
};

// Custom throttle implementation (leading + trailing)
const throttle = (func: () => void, limit: number) => {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const throttledFn = () => {
    const now = Date.now();
    const remaining = limit - (now - lastCall);

    if (remaining <= 0 || remaining > limit) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
      lastCall = now;
      func();
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = undefined;
        func();
      }, remaining);
    }
  };

  throttledFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  return throttledFn;
};

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface GridItem {
  position: Position;
  gridIndex: number;
}

export interface GridItemConfig {
  isMoving: boolean;
  position: Position;
  gridIndex: number;
}

export interface InfiniteGridProps {
  gridSize: number;
  renderItem: (itemConfig: GridItemConfig) => ReactNode;
  className?: string;
  initialPosition?: Position;
}

const ORIGIN: Position = { x: 0, y: 0 };
const NO_SIZE: Size = { height: 0, width: 0 };

const getDistance = (p1: Position, p2: Position) => Math.hypot(p2.x - p1.x, p2.y - p1.y);

const getItemIndexForPosition = (x: number, y: number): number => {
  // Special case for center
  if (x === 0 && y === 0) {
    return 0;
  }

  // Determine which layer of the spiral we're in
  const layer = Math.max(Math.abs(x), Math.abs(y));

  // Calculate the size of all inner layers
  const innerLayersSize = (2 * layer - 1) ** 2;

  // Calculate position within current layer
  let positionInLayer = 0;

  if (y === 0 && x === layer) {
    // Starting position (middle right)
    positionInLayer = 0;
  } else if (y < 0 && x === layer) {
    // Right side, bottom half
    positionInLayer = -y;
  } else if (y === -layer && x > -layer) {
    // Bottom side
    positionInLayer = layer + (layer - x);
  } else if (x === -layer && y < layer) {
    // Left side
    positionInLayer = 3 * layer + (layer + y);
  } else if (y === layer && x < layer) {
    // Top side
    positionInLayer = 5 * layer + (layer + x);
  } else {
    // Right side, top half (y > 0 && x === layer)
    positionInLayer = 7 * layer + (layer - y);
  }

  return innerLayersSize + positionInLayer;
};

const calculateVisiblePositions = (rect: Size, gridSize: number, offset: Position): Position[] => {
  // Calculate grid cells needed to fill container
  const cellsX = Math.ceil(rect.width / gridSize);
  const cellsY = Math.ceil(rect.height / gridSize);

  // Calculate center position based on offset
  const centerX = -Math.round(offset.x / gridSize);
  const centerY = -Math.round(offset.y / gridSize);

  const positions: Position[] = [];
  const halfCellsX = Math.ceil(cellsX / 2);
  const halfCellsY = Math.ceil(cellsY / 2);

  for (let y = centerY - halfCellsY; y <= centerY + halfCellsY; y += 1) {
    for (let x = centerX - halfCellsX; x <= centerX + halfCellsX; x += 1) {
      positions.push({ x, y });
    }
  }

  return positions;
};

/** What the grid renders. The engine writes here; nothing else does. */
interface View {
  setContainerSize: Dispatch<SetStateAction<Size>>;
  setGridItems: Dispatch<SetStateAction<GridItem[]>>;
  setIsDragging: Dispatch<SetStateAction<boolean>>;
  setIsMoving: Dispatch<SetStateAction<boolean>>;
  setOffset: Dispatch<SetStateAction<Position>>;
}

/**
 * The pan physics, integrated outside React: the loop, the throttle and the
 * gesture scratch all live here, and only what the picture needs is mirrored
 * into state through `view`.
 */
const createEngine = (initialOffset: Position, initialGridSize: number, view: View) => {
  let container: HTMLDivElement | null = null;
  let gridSize = initialGridSize;
  let offset = { ...initialOffset };
  let restPos = { ...initialOffset };
  let startPos = { ...initialOffset };
  let velocity: Position = { x: 0, y: 0 };
  let isDragging = false;
  let mounted = false;
  let lastPos: Position = { x: 0, y: 0 };
  let lastMoveTime = 0;
  let lastUpdateTime = 0;
  let animationFrame: number | null = null;
  const velocityHistory: Position[] = [];

  const stopMoving = debounce(() => {
    restPos = { ...offset };
    view.setIsMoving(false);
  }, REST_DELAY);

  const updateGridItems = () => {
    if (!mounted) {
      return;
    }

    const rect = container?.getBoundingClientRect();
    const size: Size = rect ? { height: rect.height, width: rect.width } : NO_SIZE;
    const positions = rect ? calculateVisiblePositions(rect, gridSize, offset) : [];
    const newItems = positions.map((position) => ({
      gridIndex: getItemIndexForPosition(position.x, position.y),
      position,
    }));

    view.setContainerSize(size);
    view.setGridItems(newItems);
    view.setIsMoving(getDistance(offset, restPos) > MOVING_DISTANCE);

    stopMoving();
  };

  const throttledUpdateGridItems = throttle(updateGridItems, UPDATE_INTERVAL);

  const animate = () => {
    if (!mounted) {
      return;
    }

    const currentTime = performance.now();
    const deltaTime = currentTime - lastUpdateTime;

    if (deltaTime >= UPDATE_INTERVAL) {
      const speed = Math.hypot(velocity.x, velocity.y);

      if (speed < MIN_VELOCITY) {
        animationFrame = null;
        velocity = { x: 0, y: 0 };
        return;
      }

      // Apply non-linear deceleration based on speed
      let deceleration = FRICTION;
      if (speed < VELOCITY_THRESHOLD) {
        // Apply stronger deceleration at lower speeds for more natural stopping
        deceleration = FRICTION * (speed / VELOCITY_THRESHOLD);
      }

      offset = { x: offset.x + velocity.x, y: offset.y + velocity.y };
      velocity = { x: velocity.x * deceleration, y: velocity.y * deceleration };
      view.setOffset(offset);
      throttledUpdateGridItems();

      lastUpdateTime = currentTime;
    }

    animationFrame = requestAnimationFrame(animate);
  };

  const handleDown = (p: Position) => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

    isDragging = true;
    startPos = { x: p.x - offset.x, y: p.y - offset.y };
    velocity = { x: 0, y: 0 };
    view.setIsDragging(true);

    lastPos = { x: p.x, y: p.y };
  };

  const handleMove = (p: Position) => {
    if (!isDragging) {
      return;
    }

    const currentTime = performance.now();
    const timeDelta = currentTime - lastMoveTime;

    // Calculate raw velocity based on position and time
    const rawVelocity = {
      x: (p.x - lastPos.x) / (timeDelta || 1),
      y: (p.y - lastPos.y) / (timeDelta || 1),
    };

    // Add to velocity history and maintain fixed size
    velocityHistory.push(rawVelocity);
    if (velocityHistory.length > VELOCITY_HISTORY_SIZE) {
      velocityHistory.shift();
    }

    // Calculate smoothed velocity using moving average
    const smoothedVelocity = { x: 0, y: 0 };
    for (const vel of velocityHistory) {
      smoothedVelocity.x += vel.x / velocityHistory.length;
      smoothedVelocity.y += vel.y / velocityHistory.length;
    }

    offset = { x: p.x - startPos.x, y: p.y - startPos.y };
    velocity = smoothedVelocity;
    view.setOffset(offset);
    updateGridItems();

    lastMoveTime = currentTime;
    lastPos = { x: p.x, y: p.y };
  };

  const handleUp = () => {
    // Also fires on mouseleave/touchcancel, which can arrive without a drag in
    // flight — bail out so we don't spawn a second animation loop.
    if (!isDragging) {
      return;
    }

    isDragging = false;
    view.setIsDragging(false);

    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    animationFrame = requestAnimationFrame(animate);
  };

  const handleTouchMove = (e: TouchEvent) => {
    const touch = e.touches.item(0);

    if (!touch) {
      return;
    }

    e.preventDefault();
    handleMove({ x: touch.clientX, y: touch.clientY });
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();

    offset = { x: offset.x - e.deltaX, y: offset.y - e.deltaY };
    velocity = { x: 0, y: 0 };
    view.setOffset(offset);
    throttledUpdateGridItems();
  };

  const mount = (element: HTMLDivElement | null) => {
    container = element;
    mounted = true;
    updateGridItems();

    // Non-passive, so the handlers can cancel the page's own scrolling.
    element?.addEventListener("wheel", handleWheel, { passive: false });
    element?.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      mounted = false;
      container = null;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      throttledUpdateGridItems.cancel();
      stopMoving.cancel();

      element?.removeEventListener("wheel", handleWheel);
      element?.removeEventListener("touchmove", handleTouchMove);
    };
  };

  const setGridSize = (size: number) => {
    gridSize = size;
  };

  return { handleDown, handleMove, handleUp, mount, setGridSize };
};

type Engine = ReturnType<typeof createEngine>;

export const InfiniteGrid = ({
  gridSize,
  renderItem,
  className,
  initialPosition,
}: InfiniteGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState<Position>(() => ({ ...(initialPosition ?? ORIGIN) }));
  const [isDragging, setIsDragging] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [gridItems, setGridItems] = useState<GridItem[]>([]);
  const [containerSize, setContainerSize] = useState<Size>(NO_SIZE);

  const engineRef = useRef<Engine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = createEngine(initialPosition ?? ORIGIN, gridSize, {
      setContainerSize,
      setGridItems,
      setIsDragging,
      setIsMoving,
      setOffset,
    });
  }

  useEffect(() => {
    engineRef.current?.setGridSize(gridSize);
  }, [gridSize]);

  useEffect(() => engineRef.current?.mount(containerRef.current), []);

  const handleMouseDown = (e: ReactMouseEvent) => {
    engineRef.current?.handleDown({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    e.preventDefault();
    engineRef.current?.handleMove({ x: e.clientX, y: e.clientY });
  };

  const handleTouchStart = (e: ReactTouchEvent) => {
    const touch = e.touches.item(0);

    if (!touch) {
      return;
    }

    engineRef.current?.handleDown({ x: touch.clientX, y: touch.clientY });
  };

  const handleUp = () => {
    engineRef.current?.handleUp();
  };

  return (
    <div
      ref={containerRef}
      role="presentation"
      className={className}
      style={{
        cursor: isDragging ? "grabbing" : "grab",
        inset: 0,
        overflow: "hidden",
        position: "absolute",
        touchAction: "none",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleUp}
      onTouchCancel={handleUp}
    >
      <div
        style={{
          inset: 0,
          position: "absolute",
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
          willChange: "transform",
        }}
      >
        {gridItems.map((item) => {
          const x = item.position.x * gridSize + containerSize.width / 2;
          const y = item.position.y * gridSize + containerSize.height / 2;

          return (
            <div
              key={`${item.position.x}-${item.position.y}`}
              style={{
                alignItems: "center",
                display: "flex",
                height: gridSize,
                justifyContent: "center",
                marginLeft: `-${gridSize / 2}px`,
                marginTop: `-${gridSize / 2}px`,
                position: "absolute",
                transform: `translate3d(${x}px, ${y}px, 0)`,
                userSelect: "none",
                width: gridSize,
                willChange: "transform",
              }}
            >
              {renderItem({
                gridIndex: item.gridIndex,
                isMoving,
                position: item.position,
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
