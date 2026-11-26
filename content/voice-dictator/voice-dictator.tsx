"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { motion } from "motion/react";

const noop = () => null;

const TRANSCRIPT_LIBRARY = [
  "The warrior should be cloaked in obsidian armor with faint runes pulsing across each plate, wind tearing through the cape as petals scatter around the scene.",
  "Let's add a soft volumetric glow behind the subject to carve out the silhouette and make the cliff edge feel like it's dissolving into the clouds below.",
  "Scatter bright motes of dust around the character so it feels like the air is alive, and make the sunset bleed into saturated oranges and violets.",
  "Bring in a shallow depth of field with a wide cinematic crop, keeping the focus on the warrior's profile while the background blurs into abstract shapes.",
  "Introduce a faint aurora stretching across the horizon to hint at ancient magic awakening right behind the hero.",
] as const;

const DEFAULT_PLACEHOLDER =
  "Generate expressive prompts by speaking naturally. We will render a faux transcript here.";

const AUTO_RESTART_DELAY = 1400;

type TimeoutHandle = ReturnType<typeof setTimeout> | null;

const pickTranscript = (script: string) => {
  const custom = script.trim();

  if (custom !== "") {
    return custom;
  }

  const index = Math.floor(Math.random() * TRANSCRIPT_LIBRARY.length);

  return TRANSCRIPT_LIBRARY[index] ?? TRANSCRIPT_LIBRARY[0];
};

const hexToRgb = (hex: string) => {
  const digits = hex.replace("#", "");

  const full =
    digits.length === 3
      ? digits.replaceAll(/./gu, (digit) => `${digit}${digit}`)
      : digits.padEnd(6, "0").slice(0, 6);

  const channels = [0, 2, 4].map((start) => Number.parseInt(full.slice(start, start + 2), 16));

  const [red = 255, green = 255, blue = 255] = channels.map((channel) =>
    Number.isNaN(channel) ? 255 : channel,
  );

  return [red, green, blue] satisfies [number, number, number];
};

export interface VoiceDictatorProps {
  /** Auto-start dictation on mount and again after each transcript finishes. */
  autoDictate?: boolean;
  background?: string;
  /** Size of one Bayer dither cell in device pixels. */
  ditherSize?: number;
  /** Strength of the soft glow hugging the ring. */
  glow?: number;
  orbSize?: number;
  /** Idle text shown before the first dictation. */
  placeholder?: string;
  /** How far simulated speech amplitude swells the ring. */
  reactivity?: number;
  ringColor?: string;
  /** Resting ring radius as a fraction of half the viewport height. */
  ringRadius?: number;
  ringThickness?: number;
  /** Fixed transcript to dictate; empty picks a random sample. */
  script?: string;
  /** Per-frame easing toward the target amplitude; higher is smoother. */
  smoothing?: number;
  /** Multiplier on word delivery rate. */
  speechRate?: number;
}

export const VoiceDictator: FC<VoiceDictatorProps> = ({
  autoDictate = false,
  background = "#000000",
  ditherSize = 1,
  glow = 0.5,
  orbSize = 32,
  placeholder = DEFAULT_PLACEHOLDER,
  reactivity = 1,
  ringColor = "#ffffff",
  ringRadius = 0.21,
  ringThickness = 0.07,
  script = "",
  smoothing = 0.95,
  speechRate = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const amplitudeRef = useRef(0.08);
  const targetAmplitudeRef = useRef(0.08);

  const [isListening, setIsListening] = useState(false);

  const [transcript, setTranscript] = useState<string | null>(null);

  const configRef = useRef({
    background,
    ditherSize,
    glow,
    reactivity,
    ringColor,
    ringRadius,
    ringThickness,
    script,
    smoothing,
    speechRate,
  });

  useEffect(() => {
    configRef.current = {
      background,
      ditherSize,
      glow,
      reactivity,
      ringColor,
      ringRadius,
      ringThickness,
      script,
      smoothing,
      speechRate,
    };
  }, [
    background,
    ditherSize,
    glow,
    reactivity,
    ringColor,
    ringRadius,
    ringThickness,
    script,
    smoothing,
    speechRate,
  ]);

  const listeningRef = useRef(false);
  const scriptRef = useRef<string[]>([]);
  const wordIndexRef = useRef(0);
  const wordTimeoutRef = useRef<TimeoutHandle>(null);
  const pulseTimeoutRef = useRef<TimeoutHandle>(null);

  const initialiseWebGL = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return null;
    }

    const gl = canvas.getContext("webgl", {
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      return null;
    }

    const vertexShaderSource = `
      attribute vec2 aPosition;

      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision highp float;

      uniform float uTime;
      uniform float uAmplitude;
      uniform vec2 uResolution;
      uniform float uRadius;
      uniform float uThickness;
      uniform float uGlow;
      uniform float uDitherSize;
      uniform vec3 uRingColor;
      uniform vec3 uBackground;

      float bayerDither(vec2 coord) {
        vec2 p = floor(mod(coord, 8.0));
        float x = p.x;
        float y = p.y;

        float index =
          1.0 * mod(x, 2.0) +
          2.0 * mod(y, 2.0) +
          4.0 * mod(floor(x / 2.0), 2.0) +
          8.0 * mod(floor(y / 2.0), 2.0) +
          16.0 * mod(floor(x / 4.0), 2.0) +
          32.0 * mod(floor(y / 4.0), 2.0);

        return (index + 0.5) / 64.0;
      }

      void main() {
        vec2 normalized = gl_FragCoord.xy / uResolution;
        vec2 uv = normalized * 2.0 - 1.0;
        uv.x *= uResolution.x / uResolution.y;

        float time = uTime * 0.5;
        float amplitude = clamp(uAmplitude, 0.0, 1.2);

        float radius = uRadius + amplitude * 0.11 + sin(time * 0.9) * 0.012;
        float thickness = uThickness + amplitude * 0.05 + sin(time * 0.63) * 0.009;

        float dist = length(uv);
        float ring = smoothstep(radius + thickness, radius, dist) - smoothstep(radius, radius - thickness, dist);
        float glow = exp(-14.0 * abs(dist - radius));
        float halo = exp(-6.5 * dist * (1.0 + amplitude * 0.35));

        float intensity = clamp(ring * 0.75 + glow * uGlow + halo * 0.08, 0.0, 1.0);

        float threshold = bayerDither(floor(gl_FragCoord.xy / uDitherSize));
        float shade = step(threshold, intensity);

        gl_FragColor = vec4(mix(uBackground, uRingColor, shade), 1.0);
      }
    `;

    const createShader = (type: GLenum, source: string) => {
      const shader = gl.createShader(type);

      if (!shader) {
        throw new Error("Unable to create shader");
      }

      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS) === true;

      if (!compiled) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(info ?? "Unknown shader compilation error");
      }

      return shader;
    };

    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

    const program = gl.createProgram();

    if (program === null) {
      throw new Error("Unable to create WebGL program");
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const linked = gl.getProgramParameter(program, gl.LINK_STATUS) === true;

    if (!linked) {
      const info = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      throw new Error(info ?? "Unknown WebGL linking error");
    }

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // eslint-disable-next-line react/hooks -- WebGL method, not a React hook.
    gl.useProgram(program);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uniforms = {
      amplitude: gl.getUniformLocation(program, "uAmplitude"),
      background: gl.getUniformLocation(program, "uBackground"),
      ditherSize: gl.getUniformLocation(program, "uDitherSize"),
      glow: gl.getUniformLocation(program, "uGlow"),
      radius: gl.getUniformLocation(program, "uRadius"),
      resolution: gl.getUniformLocation(program, "uResolution"),
      ringColor: gl.getUniformLocation(program, "uRingColor"),
      thickness: gl.getUniformLocation(program, "uThickness"),
      time: gl.getUniformLocation(program, "uTime"),
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = window.devicePixelRatio || 1;
      const width = Math.round(rect.width * pixelRatio);
      const height = Math.round(rect.height * pixelRatio);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      gl.viewport(0, 0, width, height);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const render = (time: number) => {
      animationFrameRef.current = requestAnimationFrame(render);

      // eslint-disable-next-line react/hooks -- WebGL method, not a React hook.
      gl.useProgram(program);
      const config = configRef.current;
      const [bgR, bgG, bgB] = hexToRgb(config.background);
      const [ringR, ringG, ringB] = hexToRgb(config.ringColor);
      gl.clearColor(bgR / 255, bgG / 255, bgB / 255, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const amplitude =
        amplitudeRef.current +
        (targetAmplitudeRef.current * config.reactivity - amplitudeRef.current) *
          (1 - config.smoothing);

      amplitudeRef.current = amplitude;

      if (uniforms.time) {
        gl.uniform1f(uniforms.time, time * 0.001);
      }

      if (uniforms.amplitude) {
        gl.uniform1f(uniforms.amplitude, amplitude);
      }

      if (uniforms.resolution) {
        gl.uniform2f(uniforms.resolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
      }

      gl.uniform1f(uniforms.radius, config.ringRadius);
      gl.uniform1f(uniforms.thickness, config.ringThickness);
      gl.uniform1f(uniforms.glow, config.glow);
      gl.uniform1f(uniforms.ditherSize, Math.max(1, config.ditherSize));
      gl.uniform3f(uniforms.ringColor, ringR / 255, ringG / 255, ringB / 255);
      gl.uniform3f(uniforms.background, bgR / 255, bgG / 255, bgB / 255);

      const button = buttonRef.current;

      if (button) {
        const scale = 1 + amplitude * 0.12;
        const shadowBlur = 12 + amplitude * 80;
        const opacity = 0.08 + amplitude * 0.22;
        button.style.transform = `scale(${scale})`;
        button.style.boxShadow = `0 0 ${shadowBlur.toFixed(1)}px rgba(${ringR}, ${ringG}, ${ringB}, ${opacity.toFixed(3)})`;
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    render(0);

    return () => {
      if (animationFrameRef.current !== null && animationFrameRef.current !== 0) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = null;
      resizeObserver.disconnect();
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
    };
  }, []);

  useEffect(() => {
    try {
      return initialiseWebGL() ?? noop;
    } catch (error) {
      console.error(error);

      return noop;
    }
  }, [initialiseWebGL]);

  const stopDictation = useCallback(() => {
    listeningRef.current = false;
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (!isListening) {
      if (pulseTimeoutRef.current !== null && pulseTimeoutRef.current !== 0) {
        clearTimeout(pulseTimeoutRef.current);
        pulseTimeoutRef.current = null;
      }

      targetAmplitudeRef.current = 0.06;

      return noop;
    }

    const pump = () => {
      if (!listeningRef.current) {
        return;
      }

      targetAmplitudeRef.current = 0.25 + Math.random() * 0.7;
      const delay = 120 + Math.random() * 80;
      pulseTimeoutRef.current = setTimeout(pump, delay);
    };

    pump();

    return () => {
      if (pulseTimeoutRef.current !== null && pulseTimeoutRef.current !== 0) {
        clearTimeout(pulseTimeoutRef.current);
        pulseTimeoutRef.current = null;
      }
    };
  }, [isListening]);

  useEffect(() => {
    if (!isListening) {
      if (wordTimeoutRef.current !== null && wordTimeoutRef.current !== 0) {
        clearTimeout(wordTimeoutRef.current);
        wordTimeoutRef.current = null;
      }

      return noop;
    }

    scriptRef.current = pickTranscript(configRef.current.script).split(/\s+/u);
    wordIndexRef.current = 0;

    const deliver = () => {
      if (!listeningRef.current) {
        return;
      }

      if (wordIndexRef.current >= scriptRef.current.length) {
        stopDictation();

        return;
      }

      const nextWord = scriptRef.current[wordIndexRef.current];

      if (nextWord !== undefined && nextWord !== "") {
        wordIndexRef.current += 1;
        setTranscript((previous) =>
          previous !== null && previous.length > 0 ? `${previous} ${nextWord}` : nextWord,
        );
        targetAmplitudeRef.current = 0.32 + Math.random() * 0.6;
      }

      const delay = (160 + Math.random() * 200) / Math.max(0.1, configRef.current.speechRate);
      wordTimeoutRef.current = setTimeout(deliver, delay);
    };

    const initialDelay = 220 + Math.random() * 220;
    wordTimeoutRef.current = setTimeout(deliver, initialDelay);

    return () => {
      if (wordTimeoutRef.current !== null && wordTimeoutRef.current !== 0) {
        clearTimeout(wordTimeoutRef.current);
        wordTimeoutRef.current = null;
      }
    };
  }, [isListening, stopDictation]);

  const startDictation = useCallback(() => {
    listeningRef.current = true;
    setTranscript("");
    setIsListening(true);
  }, []);

  const handleToggle = useCallback(() => {
    if (listeningRef.current) {
      stopDictation();

      return;
    }

    startDictation();
  }, [startDictation, stopDictation]);

  useEffect(() => {
    if (!autoDictate || isListening) {
      return noop;
    }

    const timeout = setTimeout(startDictation, AUTO_RESTART_DELAY);

    return () => {
      clearTimeout(timeout);
    };
  }, [autoDictate, isListening, startDictation]);

  return (
    <div
      className="relative flex h-dvh w-dvw flex-col items-center justify-center overflow-hidden text-white"
      style={{ backgroundColor: background }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <motion.button
        ref={buttonRef}
        type="button"
        aria-label={isListening ? "Stop dictation" : "Start dictation"}
        aria-pressed={isListening}
        onClick={handleToggle}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          backgroundColor: `color-mix(in srgb, ${ringColor} 80%, transparent)`,
          height: orbSize,
          width: orbSize,
        }}
        animate={{
          opacity: isListening ? 0.9 : 0.6,
          scale: isListening ? [1, 1.1, 1] : 1,
        }}
        transition={{
          opacity: {
            duration: 0.3,
            ease: "easeInOut",
          },
          scale: {
            duration: 0.6,
            ease: "easeInOut",
            repeat: isListening ? Infinity : 0,
          },
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      />

      <motion.p
        className="absolute bottom-20 z-10 max-w-2xl text-base leading-7 text-pretty sm:text-lg"
        style={{ color: `color-mix(in srgb, ${ringColor} 70%, transparent)` }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          ease: "easeInOut",
        }}
      >
        {transcript ?? placeholder}
      </motion.p>

      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-48"
        style={{
          backgroundImage: `linear-gradient(to top, ${background}, color-mix(in srgb, ${background} 40%, transparent), transparent)`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
};
