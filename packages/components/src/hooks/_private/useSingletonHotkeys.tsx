import React from "react";

/**
 * Types
 */
type Callback = (e: KeyboardEvent) => void;
type PressedKeys = Record<string, KeyboardEvent>;
type Hotkeys = Record<string, Callback | null>;
type Context = {
  isPressed: (key: string) => boolean;
  addHotkeys: (
    hotkeys: Hotkeys,
    options?: { ref: React.RefObject<HTMLElement | null> }
  ) => (() => void) | undefined;
};

/**
 * Utilities
 */
const COMBINATION_DELIMETER = "+";
const pressedMap: Record<string, KeyboardEvent> = {};

const formatHotkey = (hotkey: string) => {
  if (hotkey === " ") return hotkey;
  return hotkey.replace(/\s/g, "").toLowerCase();
};

const getHotkeyId = (hotkey: string) => {
  return formatHotkey(hotkey)
    .split(COMBINATION_DELIMETER)
    .sort()
    .join(COMBINATION_DELIMETER);
};

const getEventKey = (e: KeyboardEvent) => {
  // Having alt pressed modifies e.key value, so relying on e.code for it
  if (e.altKey && e.key !== "Alt") {
    return e.code.toLowerCase().replace(/key|digit|numpad/, "");
  }

  return e.key.toLowerCase();
};

const getCombinations = (items: string[]) => {
  const result: string[] = [];
  const f = (prefix: string, items: string[]) => {
    items.forEach((item, i) => {
      result.push(prefix ? `${prefix}+${item}` : item);
      f(prefix + item, items.slice(i + 1));
    });
  };
  f("", items);
  return result;
};

const walkPressedCombinations = (
  pressed: PressedKeys,
  cb: (id: string) => void
) => {
  const pressedKeys = Object.keys(pressed);

  if (!pressedKeys.length) return;

  const hotkey = pressedKeys.join(COMBINATION_DELIMETER);
  const id = getHotkeyId(hotkey);

  getCombinations(id.split(COMBINATION_DELIMETER)).forEach((pressedId) => {
    cb(pressedId);
  });
};

const walkHotkeys = <T extends unknown>(
  hotkeys: Record<string, T>,
  cb: (id: string, hotkeyData: T) => void
) => {
  Object.keys(hotkeys).forEach((key) => {
    key.split(",").forEach((hotkey) => {
      const data = hotkeys[key];
      if (!data) return;

      cb(getHotkeyId(hotkey), data);
    });
  });
};

class HotkeyStore {
  hotkeyMap: Record<string, { callbacks: Set<Callback>; used: boolean }> = {};

  getSize = () => Object.keys(this.hotkeyMap).length;

  bindHotkeys = (hotkeys: Hotkeys) => {
    walkHotkeys(hotkeys, (id, hotkeyData) => {
      if (!hotkeyData) return;

      if (!this.hotkeyMap[id]) {
        this.hotkeyMap[id] = { callbacks: new Set(), used: false };
      }

      this.hotkeyMap[id].callbacks.add(hotkeyData);
    });
  };

  unbindHotkeys = (hotkeys: Hotkeys) => {
    walkHotkeys(hotkeys, (id, hotkeyCallback) => {
      if (!hotkeyCallback) return;
      this.hotkeyMap[id]?.callbacks.delete(hotkeyCallback);

      if (!this.hotkeyMap[id]?.callbacks.size) {
        delete this.hotkeyMap[id];
      }
    });
  };

  handleKeyDown = (pressedMap: PressedKeys) => {
    walkPressedCombinations(pressedMap, (pressedId) => {
      const hotkeyData = this.hotkeyMap[pressedId];

      if (!hotkeyData || hotkeyData.used) return;

      if (hotkeyData?.callbacks.size) {
        hotkeyData.callbacks.forEach((callback) => {
          callback(pressedMap[pressedId]);
          this.hotkeyMap[pressedId].used = true;
          hotkeyData.used = true;
        });
      }
    });
  };

  handleKeyUp = (e: KeyboardEvent) => {
    const id = getHotkeyId(e.key);

    walkHotkeys(this.hotkeyMap, (hotkeyId, data) => {
      const hotkeyIds = hotkeyId.split(COMBINATION_DELIMETER);

      if (hotkeyIds.includes(id)) data.used = false;
    });
  };
}

const globalHotkeyStore = new HotkeyStore();

/**
 * Components / Hooks
 */
export const HotkeyContext = React.createContext({} as Context);

export const SingletonHotkeysProvider = (props: {
  children: React.ReactNode;
}) => {
  const { children } = props;
  // eslint-disable-next-line
  const [_, setTriggerCount] = React.useState<number>(0);
  // Only handle key presses when there is at least one hook listening for hotkeys
  const [hooksCount, setHooksCount] = React.useState(0);

  const addPressedKey = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.repeat || hooksCount === 0) return;

      const eventKey = getEventKey(e);

      pressedMap[eventKey] = e;
      setTriggerCount(Object.keys(pressedMap).length);
    },
    [hooksCount]
  );

  const removePressedKey = React.useCallback(
    (e: KeyboardEvent) => {
      if (hooksCount === 0) return;

      const eventKey = getEventKey(e);

      delete pressedMap[eventKey];
      setTriggerCount(Object.keys(pressedMap).length);
    },
    [hooksCount]
  );

  const isPressed = (hotkey: string) => {
    const keys = formatHotkey(hotkey).split(COMBINATION_DELIMETER);

    if (keys.some((key) => !pressedMap[key])) return false;
    return true;
  };

  const addHotkeys: Context["addHotkeys"] = React.useCallback(
    (hotkeys, options) => {
      const ref = options?.ref;
      const localHotkeyStore = ref?.current ? new HotkeyStore() : null;

      const handleRefKeyDown = (e: KeyboardEvent) => {
        if (!localHotkeyStore) return;

        const nextHotkeyId = getHotkeyId(e.key);
        const nextPressed = { ...pressedMap, [nextHotkeyId]: e };

        localHotkeyStore.handleKeyDown(nextPressed);
      };

      const handleRefKeyUp = (e: KeyboardEvent) => {
        localHotkeyStore?.handleKeyUp(e);
      };

      setHooksCount((prev) => prev + 1);
      if (localHotkeyStore && ref?.current) {
        localHotkeyStore?.bindHotkeys(hotkeys);
        ref.current.addEventListener("keydown", handleRefKeyDown);
        ref.current.addEventListener("keyup", handleRefKeyUp);
      } else {
        globalHotkeyStore.bindHotkeys(hotkeys);
      }

      return () => {
        setHooksCount((prev) => prev - 1);
        if (ref?.current && localHotkeyStore) {
          localHotkeyStore?.unbindHotkeys(hotkeys);
          ref.current.removeEventListener("keydown", handleRefKeyDown);
          ref.current.removeEventListener("keyup", handleRefKeyUp);
        } else {
          globalHotkeyStore.unbindHotkeys(hotkeys);
        }
      };
    },
    []
  );

  const handleWindowKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      addPressedKey(e);
      globalHotkeyStore.handleKeyDown(pressedMap);
    },
    [addPressedKey]
  );

  const handleWindowKeyUp = React.useCallback(
    (e: KeyboardEvent) => {
      removePressedKey(e);
      globalHotkeyStore.handleKeyUp(e);
    },
    [removePressedKey]
  );

  React.useEffect(() => {
    window.addEventListener("keydown", handleWindowKeyDown);
    window.addEventListener("keyup", handleWindowKeyUp);

    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
      window.removeEventListener("keyup", handleWindowKeyUp);
    };
  }, [handleWindowKeyDown, handleWindowKeyUp]);

  return (
    <HotkeyContext.Provider value={{ addHotkeys, isPressed }}>
      {children}
    </HotkeyContext.Provider>
  );
};

const useSingletonHotkeys = () => React.useContext(HotkeyContext);

export default useSingletonHotkeys;
