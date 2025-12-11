"use client";

import React, {
  MutableRefObject,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const vertexShaderSource = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_burst;

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 leftCenter = vec2(0.18, 0.52);
  vec2 rightCenter = vec2(0.82, 0.48);
  vec2 mid = vec2(0.5, 0.5);

  vec2 leftDir = vec2((uv.x - leftCenter.x) * aspect, uv.y - leftCenter.y);
  vec2 rightDir = vec2((uv.x - rightCenter.x) * aspect, uv.y - rightCenter.y);
  vec2 midDir = vec2((uv.x - mid.x) * aspect * 1.15, (uv.y - mid.y) * 1.2);

  float leftGlow = pow(max(0.0, 1.0 - length(leftDir) * 1.5), 2.4);
  float rightGlow = pow(max(0.0, 1.0 - length(rightDir) * 1.5), 2.4);
  float midGlow = pow(max(0.0, 1.0 - length(midDir) * 1.75), 2.0);

  float wave = sin((uv.y + uv.x * 0.4) * 20.0 + u_time * 2.0) * 0.12;
  float noiseField = hash21(floor(uv * vec2(80.0, 45.0)) + u_time * 0.05);
  float shimmer = wave + (noiseField - 0.5) * 0.14;

  float burst = u_burst * exp(-4.0 * length(midDir));
  float halo = smoothstep(0.3, 0.0, length(midDir) - 0.02);

  leftGlow += shimmer * 0.35 * leftGlow;
  rightGlow += shimmer * 0.35 * rightGlow;
  midGlow += halo * 0.25;

  float accent = smoothstep(0.58, 0.0, abs(uv.x - 0.5) * aspect * 1.1);

  vec3 leftColor = vec3(1.0, 0.42, 0.22);
  vec3 rightColor = vec3(0.24, 0.54, 1.0);
  vec3 midColor = vec3(0.65, 0.75, 1.0);

  vec3 color = leftColor * leftGlow + rightColor * rightGlow;
  color += midColor * (midGlow * 0.45 + accent * 0.1);
  color += (leftColor + rightColor) * burst * 0.6;

  float vignette = smoothstep(0.0, 0.4, uv.x) * smoothstep(1.0, 0.6, uv.x);
  color *= mix(0.75, 1.2, vignette);

  gl_FragColor = vec4(color, (leftGlow + rightGlow + midGlow * 0.3 + burst) * 0.8);
}
`;

type GlowCanvasProps = {
  triggerRef: MutableRefObject<(() => void) | null>;
};

const GlowCanvas: React.FC<GlowCanvasProps> = ({ triggerRef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>();
  const burstRef = useRef(0);
  const startTime = useRef<number | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const uniformLocations = useRef<{
    resolution?: WebGLUniformLocation | null;
    time?: WebGLUniformLocation | null;
    burst?: WebGLUniformLocation | null;
  }>({});
  const setup = useMemo(() => {
    const compileShader = (
      gl: WebGLRenderingContext,
      source: string,
      type: number,
    ): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const initProgram = (
      gl: WebGLRenderingContext,
    ): WebGLProgram | null => {
      const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
      const fragmentShader = compileShader(
        gl,
        fragmentShaderSource,
        gl.FRAGMENT_SHADER,
      );
      if (!vertexShader || !fragmentShader) return null;
      const program = gl.createProgram();
      if (!program) return null;
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
      }
      return program;
    };

    return { compileShader, initProgram };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { premultipliedAlpha: false });
    if (!gl) return;

    const resize = () => {
      if (!canvas.parentElement) return;
      const { width, height } = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = Math.floor(width * dpr);
      const displayHeight = Math.floor(height * dpr);
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();

    const program = setup.initProgram(gl);
    if (!program) return;
    programRef.current = program;
    gl.useProgram(program);

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        1, 1,
      ]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    uniformLocations.current = {
      resolution: gl.getUniformLocation(program, "u_resolution"),
      time: gl.getUniformLocation(program, "u_time"),
      burst: gl.getUniformLocation(program, "u_burst"),
    };

    const render = (timestamp: number) => {
      if (!gl || !canvas) return;

      if (!startTime.current) startTime.current = timestamp;
      const elapsed = (timestamp - startTime.current) / 1000;
      const previous = (render as unknown as { prev?: number }).prev ?? timestamp;
      const delta = (timestamp - previous) / 1000;
      (render as unknown as { prev?: number }).prev = timestamp;
      burstRef.current = Math.max(0, burstRef.current - delta * 1.6);

      gl.useProgram(program);

      if (uniformLocations.current.resolution) {
        gl.uniform2f(
          uniformLocations.current.resolution,
          canvas.width,
          canvas.height,
        );
      }
      if (uniformLocations.current.time) {
        gl.uniform1f(uniformLocations.current.time, elapsed);
      }
      if (uniformLocations.current.burst) {
        gl.uniform1f(uniformLocations.current.burst, burstRef.current);
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    const handleResize = () => {
      resize();
    };

    window.addEventListener("resize", handleResize);

    triggerRef.current = () => {
      burstRef.current = 1.0;
    };

    return () => {
      triggerRef.current = null;
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (programRef.current) {
        gl.deleteProgram(programRef.current);
      }
    };
  }, [setup, triggerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
};

const BackgroundDecor = memo(() => {
  const columns = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        id: index,
        left: ((index * 9) % 100) - 10 + Math.sin(index * 0.7) * 3,
        delay: (index % 5) * 1.2,
        content: index % 2 === 0 ? "XQOV AIXL" : "ΔΣ01 ∴", // subtle sci-fi text
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {columns.map((column) => (
        <div
          key={column.id}
          className="absolute top-0 text-[10px] font-mono uppercase tracking-[0.4em] text-white/5"
          style={{
            left: `${column.left}%`,
            animation: `float-down 12s linear ${column.delay}s infinite`,
            writingMode: "vertical-rl",
          }}
        >
          {column.content.repeat(12)}
        </div>
      ))}
    </div>
  );
});

const GlobalStyles = memo(() => (
  <style>{`
  @keyframes float-down {
    0% {
      transform: translateY(-60%);
      opacity: 0;
    }
    30% {
      opacity: 0.35;
    }
    100% {
      transform: translateY(80%);
      opacity: 0;
    }
  }

  .prompt-inout .sending {
    filter: drop-shadow(0 0 40px rgba(102, 140, 255, 0.35));
  }

  .prompt-inout .sending input {
    letter-spacing: 0.01em;
  }
`}</style>
));

const PlusIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M6 1v10M1 6h10"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

const SparkIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="m7 1 1.2 2.9L11 5.3 8.7 7l.9 3.2L7 8.5 4.4 10.2l.9-3.2L3 5.3l2.8-1.4z"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinejoin="round"
    />
  </svg>
);

const VoiceIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M4.8 4.1A2.2 2.2 0 0 1 7 2a2.2 2.2 0 0 1 2.2 2.1v2a2.2 2.2 0 0 1-2.2 2.2A2.2 2.2 0 0 1 4.8 6zm4.9.9v1.1A2.7 2.7 0 0 1 7 8.8 2.7 2.7 0 0 1 4.3 6V4.9m2.7 4.6v1.3m-1.8 0h3.6"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M2.2 3.8 5 6.6l2.8-2.8"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PromptInout: React.FC = () => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const glowTriggerRef = useRef<(() => void) | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) return;
    glowTriggerRef.current?.();
    setIsSending(true);
    const form = event.currentTarget;
    form.classList.add("sending");
    setTimeout(() => {
      setIsSending(false);
      form.classList.remove("sending");
    }, 600);
    setMessage("");
  };

  return (
    <div className="prompt-inout relative flex min-h-[500px] items-center justify-center overflow-hidden rounded-[32px] bg-[#090b13] px-6 py-16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <GlobalStyles />
      <GlowCanvas triggerRef={glowTriggerRef} />
      <BackgroundDecor />
      <form
        onSubmit={handleSubmit}
        className={`relative z-10 flex w-full max-w-2xl items-center gap-3 rounded-[26px] border border-white/10 bg-gradient-to-b from-[#151924]/80 to-[#0f111a]/95 px-4 py-3 backdrop-blur-[30px] transition duration-300 ${
          isSending ? "shadow-[0_0_70px_rgba(84,134,255,0.45)]" : "shadow-[0_20px_80px_rgba(8,13,26,0.65)]"
        }`}
      >
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/30 hover:text-white"
        >
          <PlusIcon />
        </button>
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.28em] text-white/30">
            <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/60 transition hover:border-white/25 hover:text-white/80">
              Normal <ChevronDownIcon />
            </span>
            <span className="flex items-center gap-1 rounded-full border border-[#5431ff]/40 bg-[#2b1c5f]/40 px-3 py-1 text-[#c5b9ff]">
              <SparkIcon /> DeepThink
            </span>
          </div>
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Ask anything..."
            className="w-full border-none bg-transparent text-[17px] font-medium tracking-tight text-white/90 outline-none placeholder:text-white/40"
          />
        </div>
        <button
          type="button"
          className="flex h-10 min-w-[5rem] items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-[11px] font-medium uppercase tracking-[0.3em] text-white/60 transition hover:border-white/25 hover:text-white/80"
        >
          <VoiceIcon /> Voice
        </button>
        <button
          type="submit"
          aria-label="Send message"
          className={`relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#fe8c3d] via-[#f0546a] to-[#5a68ff] text-white shadow-[0_0_25px_rgba(112,123,255,0.45)] transition-transform duration-300 ${
            isSending ? "scale-95" : "hover:scale-105"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="m5 13 8-4-8-4v8Z"
              fill="currentColor"
              className="drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]"
            />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default PromptInout;
