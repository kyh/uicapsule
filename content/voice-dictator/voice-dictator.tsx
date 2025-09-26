"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const TRANSCRIPT_LIBRARY = [
  "The warrior should be cloaked in obsidian armor with faint runes pulsing across each plate, wind tearing through the cape as petals scatter around the scene.",
  "Let's add a soft volumetric glow behind the subject to carve out the silhouette and make the cliff edge feel like it's dissolving into the clouds below.",
  "Scatter bright motes of dust around the character so it feels like the air is alive, and make the sunset bleed into saturated oranges and violets.",
  "Bring in a shallow depth of field with a wide cinematic crop, keeping the focus on the warrior's profile while the background blurs into abstract shapes.",
  "Introduce a faint aurora stretching across the horizon to hint at ancient magic awakening right behind the hero.",
] as const;

type WebGLResources = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  uniforms: {
    time: WebGLUniformLocation | null;
    amplitude: WebGLUniformLocation | null;
    resolution: WebGLUniformLocation | null;
  };
};

type TimeoutHandle = ReturnType<typeof setTimeout> | null;

const pickRandom = <T,>(items: readonly T[], exclude?: T) => {
  if (items.length === 0) {
    throw new Error("Cannot pick from an empty collection");
  }

  if (items.length === 1) {
    return items[0]!;
  }

  let candidate = items[Math.floor(Math.random() * items.length)]!;
  if (exclude !== undefined) {
    let safety = 0;
    while (candidate === exclude && safety < 10) {
      candidate = items[Math.floor(Math.random() * items.length)]!;
      safety += 1;
    }
  }

  return candidate;
};

export const VoiceDictator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const webglRef = useRef<WebGLResources | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const amplitudeRef = useRef(0.08);
  const targetAmplitudeRef = useRef(0.08);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(
    "Generate expressive prompts by speaking naturally. We will render a faux transcript here.",
  );

  const listeningRef = useRef(false);
  const scriptRef = useRef<string[]>([]);
  const wordIndexRef = useRef(0);
  const wordTimeoutRef = useRef<TimeoutHandle>(null);
  const pulseTimeoutRef = useRef<TimeoutHandle>(null);

  const initialiseWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) return;

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

        float radius = 0.35 + amplitude * 0.18 + sin(time * 0.9) * 0.02;
        float thickness = 0.12 + amplitude * 0.08 + sin(time * 0.63) * 0.015;

        float dist = length(uv);
        float ring = smoothstep(radius + thickness, radius, dist) - smoothstep(radius, radius - thickness, dist);
        float glow = exp(-14.0 * abs(dist - radius));
        float halo = exp(-6.5 * dist * (1.0 + amplitude * 0.35));

        float intensity = clamp(ring * 0.75 + glow * 0.5 + halo * 0.08, 0.0, 1.0);

        float threshold = bayerDither(gl_FragCoord.xy);
        float shade = step(threshold, intensity);

        gl_FragColor = vec4(vec3(shade), 1.0);
      }
    `;

    const createShader = (type: GLenum, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Unable to create shader");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!compiled) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(info ?? "Unknown shader compilation error");
      }
      return shader;
    };

    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(
      gl.FRAGMENT_SHADER,
      fragmentShaderSource,
    );

    const program = gl.createProgram();
    if (!program) throw new Error("Unable to create WebGL program");

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
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
    const vertices = new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uniforms = {
      time: gl.getUniformLocation(program, "uTime"),
      amplitude: gl.getUniformLocation(program, "uAmplitude"),
      resolution: gl.getUniformLocation(program, "uResolution"),
    };

    webglRef.current = { gl, program, uniforms };

    const resize = () => {
      if (!canvas) return;
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

    const render = (time: number) => {
      animationFrameRef.current = requestAnimationFrame(render);
      const resources = webglRef.current;
      if (!resources) return;
      const {
        gl: context,
        program: shaderProgram,
        uniforms: shaderUniforms,
      } = resources;

      resize();
      context.useProgram(shaderProgram);
      context.clearColor(0, 0, 0, 1);
      context.clear(context.COLOR_BUFFER_BIT);

      const smoothing = 0.95; // Increased smoothing for smoother animations
      const amplitude =
        amplitudeRef.current +
        (targetAmplitudeRef.current - amplitudeRef.current) * (1 - smoothing);
      amplitudeRef.current = amplitude;

      if (shaderUniforms.time) {
        context.uniform1f(shaderUniforms.time, time * 0.001);
      }
      if (shaderUniforms.amplitude) {
        context.uniform1f(shaderUniforms.amplitude, amplitude);
      }
      if (shaderUniforms.resolution) {
        context.uniform2f(
          shaderUniforms.resolution,
          context.drawingBufferWidth,
          context.drawingBufferHeight,
        );
      }

      const button = buttonRef.current;
      if (button) {
        const scale = 1 + amplitude * 0.12;
        const glow = 12 + amplitude * 80;
        const opacity = 0.08 + amplitude * 0.22;
        button.style.transform = `scale(${scale})`;
        button.style.boxShadow = `0 0 ${glow.toFixed(1)}px rgba(255, 255, 255, ${opacity.toFixed(3)})`;
      }

      context.drawArrays(context.TRIANGLES, 0, 6);
    };

    render(0);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = null;
    };
  }, []);

  useEffect(() => {
    try {
      const cleanup = initialiseWebGL();
      return () => {
        if (cleanup) cleanup();
        webglRef.current = null;
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }, [initialiseWebGL]);

  useEffect(() => {
    listeningRef.current = isListening;
  }, [isListening]);

  const stopDictation = useCallback((completed = false) => {
    listeningRef.current = false;
    setIsListening(false);
    targetAmplitudeRef.current = completed ? 0.12 : 0.06;
  }, []);

  useEffect(() => {
    if (!isListening) {
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
        pulseTimeoutRef.current = null;
      }
      targetAmplitudeRef.current = 0.06;
      return;
    }

    const pump = () => {
      if (!listeningRef.current) return;
      targetAmplitudeRef.current = 0.25 + Math.random() * 0.7;
      const delay = 120 + Math.random() * 80; // More consistent timing
      pulseTimeoutRef.current = setTimeout(pump, delay);
    };

    pump();

    return () => {
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
        pulseTimeoutRef.current = null;
      }
    };
  }, [isListening]);

  useEffect(() => {
    if (!isListening) {
      if (wordTimeoutRef.current) {
        clearTimeout(wordTimeoutRef.current);
        wordTimeoutRef.current = null;
      }
      return;
    }

    const transcriptScript = pickRandom(TRANSCRIPT_LIBRARY);
    scriptRef.current = transcriptScript.split(" ");
    wordIndexRef.current = 0;
    setTranscript("");

    const deliver = () => {
      if (!listeningRef.current) return;
      if (wordIndexRef.current >= scriptRef.current.length) {
        stopDictation(true);
        return;
      }

      const nextWord = scriptRef.current[wordIndexRef.current];
      if (nextWord) {
        wordIndexRef.current += 1;
        setTranscript((previous) =>
          previous.length > 0 ? `${previous} ${nextWord}` : nextWord,
        );
        targetAmplitudeRef.current = 0.32 + Math.random() * 0.6;
      }

      const delay = 160 + Math.random() * 200; // More consistent word timing
      wordTimeoutRef.current = setTimeout(deliver, delay);
    };

    const initialDelay = 220 + Math.random() * 220;
    wordTimeoutRef.current = setTimeout(deliver, initialDelay);

    return () => {
      if (wordTimeoutRef.current) {
        clearTimeout(wordTimeoutRef.current);
        wordTimeoutRef.current = null;
      }
    };
  }, [isListening, stopDictation]);

  useEffect(() => {
    return () => {
      if (wordTimeoutRef.current) {
        clearTimeout(wordTimeoutRef.current);
      }
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleToggle = useCallback(() => {
    if (listeningRef.current) {
      stopDictation(false);
      return;
    }

    listeningRef.current = true;
    setIsListening(true);
  }, [stopDictation]);

  return (
    <div className="relative flex h-dvh w-dvw flex-col items-center justify-center overflow-hidden bg-black text-white">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <motion.button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="absolute top-1/2 left-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80"
        animate={{
          scale: isListening ? [1, 1.1, 1] : 1,
          opacity: isListening ? 0.9 : 0.6,
        }}
        transition={{
          scale: {
            duration: 0.6,
            repeat: isListening ? Infinity : 0,
            ease: "easeInOut",
          },
          opacity: {
            duration: 0.3,
            ease: "easeInOut",
          },
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      />

      <motion.p
        className="absolute bottom-20 z-10 max-w-2xl text-base leading-7 text-pretty text-white/70 sm:text-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          ease: "easeInOut",
        }}
      >
        {transcript}
      </motion.p>

      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-48 bg-gradient-to-t from-black via-black/40 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
};
