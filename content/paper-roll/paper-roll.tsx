"use client";

// Ported from https://github.com/thebuggeddev/paper-roll (VX — The Printing Roll).
// An endless strip of paper unrolls behind a heavy roll, printing portfolio
// pages in its wake. One texture atlas, one ribbon mesh, fixed vertex budget,
// zero per-frame allocations. Everything procedural, nothing external.

import { useEffect, useRef } from "react";
import * as THREE from "three";

const RIBBON_W = 1.5; // paper width
const ATLAS_N = 8; // pages in the atlas
const ROLL_R = 1.75;
// one full revolution lays down exactly one atlas — this is what makes the
// print on the barrel hand off to the floor with zero drift, forever
const CARD_LEN = (2 * Math.PI * ROLL_R) / ATLAS_N;
const INNER_R = ROLL_R * 0.52;
const STEP = 0.12; // path sampling distance
const MAX_PTS = 760; // fixed history budget (~91 world units of trail)
const CURL_SEG = 16; // segments peeling off the roll
const MAX_SEG = MAX_PTS + CURL_SEG + 2;
const FLOOR_RGB = "vec3(0.905, 0.905, 0.912)";

export const PaperRoll = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = rootRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    // ---------- Renderer / scene ----------
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeaeaec);
    scene.fog = new THREE.Fog(0xeaeaec, 24, 58);

    const camera = new THREE.PerspectiveCamera(
      32,
      container.clientWidth / container.clientHeight,
      0.5,
      200,
    );

    // ---------- Lighting ----------
    const hemi = new THREE.HemisphereLight(0xffffff, 0xd6d6da, 0.95);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xffffff, 0.85);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -9;
    sun.shadow.camera.right = 9;
    sun.shadow.camera.top = 9;
    sun.shadow.camera.bottom = -9;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 40;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);
    scene.add(sun.target);

    const fill = new THREE.DirectionalLight(0xffffff, 0.22);
    fill.position.set(-6, 4, -8);
    scene.add(fill);

    // ---------- Floor ----------
    const floorGeo = new THREE.PlaneGeometry(400, 400);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xe7e7ea,
      roughness: 1.0,
      metalness: 0,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // ============================================================
    // Procedural texture atlas — 8 portfolio pages, one canvas
    // ============================================================
    function buildAtlas() {
      const CELL = 512;
      const cv = document.createElement("canvas");
      cv.width = CELL * ATLAS_N;
      cv.height = CELL;
      const g = cv.getContext("2d")!;

      const INK = "#161616";
      const PAPER = "#fbfaf7";
      const ORANGE = "#e4551f";
      const AMBER = "#f0a32e";
      const BLUE = "#1e4fd6";

      // paper strip base
      g.fillStyle = "#f6f5f1";
      g.fillRect(0, 0, cv.width, cv.height);
      // faint fibre grain
      for (let i = 0; i < 2600; i++) {
        g.fillStyle = `rgba(120,116,105,${0.015 + rand() * 0.03})`;
        g.fillRect(rand() * cv.width, rand() * cv.height, 1 + rand() * 2, 1);
      }

      const bars = (x: number, y: number, w: number, n: number, lh: number, color?: string) => {
        g.fillStyle = color || "#c9c8c2";
        for (let r = 0; r < n; r++) {
          const bw = w * (0.55 + rand() * 0.45);
          g.fillRect(x, y + r * lh, bw, Math.max(2, lh * 0.42));
        }
      };
      const label = (x: number, y: number, txt: string, color?: string, size?: number) => {
        g.fillStyle = color || INK;
        g.font = `700 ${size || 13}px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif`;
        g.fillText(txt, x, y);
      };
      const mono = (x: number, y: number, txt: string, color?: string, size?: number) => {
        g.fillStyle = color || "#8a8a86";
        g.font = `600 ${size || 11}px "SF Mono", Menlo, Consolas, monospace`;
        g.fillText(txt, x, y);
      };
      // fake photo: layered gradient blocks
      const photo = (x: number, y: number, w: number, h: number, tint: [string, string]) => {
        const gr = g.createLinearGradient(x, y, x + w, y + h);
        gr.addColorStop(0, tint[0]);
        gr.addColorStop(1, tint[1]);
        g.fillStyle = gr;
        g.fillRect(x, y, w, h);
        for (let b = 0; b < 9; b++) {
          const bw = w * (0.08 + rand() * 0.3);
          const bh = h * (0.1 + rand() * 0.5);
          const bx = x + rand() * (w - bw);
          const by = y + h - bh - rand() * h * 0.25;
          g.fillStyle = `rgba(${rand() < 0.5 ? "20,20,22" : "245,244,240"},${0.12 + rand() * 0.3})`;
          g.fillRect(bx, by, bw, bh);
        }
        const hl = g.createLinearGradient(x, y, x, y + h * 0.5);
        hl.addColorStop(0, "rgba(255,255,255,0.28)");
        hl.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = hl;
        g.fillRect(x, y, w, h * 0.5);
      };

      const M = 30; // card inset inside cell

      type Frame = { x: number; y: number; w: number; h: number };

      const cardFrame = (cx: number): Frame => {
        const x = cx + M;
        const y = M;
        const w = CELL - M * 2;
        const h = CELL - M * 2;
        g.save();
        g.shadowColor = "rgba(30,30,30,0.10)";
        g.shadowBlur = 14;
        g.shadowOffsetY = 3;
        g.fillStyle = PAPER;
        g.fillRect(x, y, w, h);
        g.restore();
        g.strokeStyle = "rgba(20,20,20,0.08)";
        g.lineWidth = 1;
        g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
        return { x, y, w, h };
      };
      const indexTag = (f: Frame, n: number) => {
        g.save();
        g.translate(f.x + f.w - 12, f.y + f.h - 14);
        g.rotate(-Math.PI / 2);
        mono(0, 0, `0${n}/008`, "#9a9994", 11);
        g.restore();
      };

      const draws: ((f: Frame) => void)[] = [
        // 01 — orange field, dark disc, editorial header
        (f) => {
          label(f.x + 22, f.y + 36, "VX PRESS", INK, 15);
          mono(f.x + f.w - 96, f.y + 34, "A/W 26");
          g.fillStyle = ORANGE;
          g.fillRect(f.x + 22, f.y + 54, f.w - 44, f.h - 150);
          g.fillStyle = "rgba(20,16,12,0.85)";
          g.beginPath();
          g.arc(f.x + f.w / 2, f.y + 54 + (f.h - 150) / 2, (f.h - 150) * 0.31, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = "rgba(255,255,255,0.9)";
          g.fillRect(f.x + 44, f.y + 54 + (f.h - 150) * 0.68, f.w - 200, 5);
          bars(f.x + 22, f.y + f.h - 78, f.w * 0.5, 3, 15);
          label(f.x + f.w - 130, f.y + f.h - 30, "ATELIER 041", "#8a8a86", 11);
        },
        // 02 — black and white architecture photo
        (f) => {
          photo(f.x + 20, f.y + 20, f.w - 40, f.h * 0.62, ["#3a3a3e", "#0e0e10"]);
          label(f.x + 22, f.y + f.h * 0.62 + 52, "CONCRETE INDEX", INK, 17);
          bars(f.x + 22, f.y + f.h * 0.62 + 70, f.w - 60, 3, 15);
          mono(f.x + 22, f.y + f.h - 26, "PP. 112 — 139");
        },
        // 03 — typographic cover
        (f) => {
          g.fillStyle = INK;
          g.font = '800 italic 128px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';
          g.fillText("VX", f.x + 26, f.y + 148);
          g.fillStyle = ORANGE;
          g.fillRect(f.x + 30, f.y + 176, 66, 10);
          bars(f.x + 30, f.y + 214, f.w - 90, 7, 22, "#b9b8b2");
          label(f.x + 30, f.y + f.h - 34, "MANIFESTO — TEN RULES OF PRINT", "#5c5c60", 12);
        },
        // 04 — grid of six studies
        (f) => {
          label(f.x + 22, f.y + 36, "STUDIES", INK, 14);
          mono(f.x + f.w - 108, f.y + 34, "GRID 3×2");
          const tints: [string, string][] = [
            ["#c9c9ce", "#8f8f96"],
            [AMBER, "#c77e14"],
            ["#2c2c30", "#141416"],
            ["#dcd9d2", "#b0aca2"],
            [BLUE, "#123089"],
            ["#7d7d84", "#4c4c52"],
          ];
          const gw = (f.w - 44 - 24) / 3;
          const gh = (f.h - 170) / 2;
          for (let i = 0; i < 6; i++) {
            const gx = f.x + 22 + (i % 3) * (gw + 12);
            const gy = f.y + 56 + Math.floor(i / 3) * (gh + 12);
            photo(gx, gy, gw, gh, tints[i]!);
          }
          bars(f.x + 22, f.y + f.h - 84, f.w * 0.6, 3, 15);
        },
        // 05 — amber arcs
        (f) => {
          g.fillStyle = AMBER;
          g.fillRect(f.x + 20, f.y + 20, f.w - 40, f.h - 40);
          g.strokeStyle = "rgba(251,250,247,0.9)";
          g.lineWidth = 7;
          for (let a = 0; a < 5; a++) {
            g.beginPath();
            g.arc(f.x + f.w * 0.5, f.y + f.h * 0.86, 46 + a * 34, Math.PI, Math.PI * 2);
            g.stroke();
          }
          g.fillStyle = "rgba(22,18,10,0.9)";
          g.fillRect(f.x + 42, f.y + 46, 88, 12);
          label(f.x + 42, f.y + 84, "SOUND / SHAPE", "#161616", 15);
          mono(f.x + 42, f.y + f.h - 44, "INSTALLATION — HALL B", "rgba(22,18,10,0.75)");
        },
        // 06 — device mock over blue band
        (f) => {
          g.fillStyle = BLUE;
          g.fillRect(f.x + 20, f.y + f.h * 0.58, f.w - 40, f.h * 0.42 - 20);
          label(f.x + 24, f.y + 42, "INTERFACE No.9", INK, 15);
          bars(f.x + 24, f.y + 58, f.w * 0.55, 2, 14);
          // device
          const dw = f.w * 0.44;
          const dh = f.h * 0.52;
          const dx = f.x + f.w / 2 - dw / 2;
          const dy = f.y + f.h * 0.3;
          g.save();
          g.shadowColor = "rgba(10,20,60,0.35)";
          g.shadowBlur = 18;
          g.shadowOffsetY = 8;
          g.fillStyle = "#101014";
          g.fillRect(dx, dy, dw, dh);
          g.restore();
          g.fillStyle = "#fbfaf7";
          g.fillRect(dx + 8, dy + 8, dw - 16, dh - 16);
          photo(dx + 8, dy + 8, dw - 16, (dh - 16) * 0.5, ["#9aa8d8", "#5468b8"]);
          bars(dx + 16, dy + 12 + (dh - 16) * 0.5 + 8, dw - 44, 4, 12);
          mono(f.x + 26, f.y + f.h - 32, "CASE — LEDGER APP", "rgba(251,250,247,0.85)");
        },
        // 07 — quiet white, small centered plate
        (f) => {
          const pw = f.w * 0.42;
          const ph = f.h * 0.4;
          photo(f.x + (f.w - pw) / 2, f.y + 72, pw, ph, ["#d9d6cd", "#a8a49a"]);
          g.fillStyle = ORANGE;
          g.beginPath();
          g.arc(f.x + (f.w + pw) / 2 - 8, f.y + 72 + 8, 9, 0, Math.PI * 2);
          g.fill();
          label(f.x + f.w / 2 - 62, f.y + 96 + ph + 26, "STILL LIFE, 04", INK, 14);
          bars(f.x + f.w / 2 - 84, f.y + 96 + ph + 44, 168, 3, 14);
          mono(f.x + f.w / 2 - 46, f.y + f.h - 30, "EDITION 2026");
        },
        // 08 — dark closing plate
        (f) => {
          g.fillStyle = "#141416";
          g.fillRect(f.x + 20, f.y + 20, f.w - 40, f.h - 40);
          g.strokeStyle = "rgba(251,250,247,0.35)";
          g.lineWidth = 1;
          for (let l = 0; l < 6; l++) {
            g.beginPath();
            g.moveTo(f.x + 44, f.y + 70 + l * 26);
            g.lineTo(f.x + f.w - 44, f.y + 70 + l * 26);
            g.stroke();
          }
          g.fillStyle = ORANGE;
          g.beginPath();
          g.arc(f.x + f.w - 78, f.y + 96, 16, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = "#fbfaf7";
          g.font = '800 italic 44px -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';
          g.fillText("END / LOOP", f.x + 44, f.y + f.h - 96);
          mono(f.x + 44, f.y + f.h - 52, "THE ROLL CONTINUES", "rgba(251,250,247,0.6)");
        },
      ];

      for (let c = 0; c < ATLAS_N; c++) {
        const frame = cardFrame(c * CELL);
        draws[c]!(frame);
        indexTag(frame, c + 1);
      }

      const tex = new THREE.CanvasTexture(cv);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return tex;
    }

    // Spiral cap: hundreds of wound paper layers, drawn once
    function buildCapTexture() {
      const S = 1024;
      const cv = document.createElement("canvas");
      cv.width = S;
      cv.height = S;
      const g = cv.getContext("2d")!;
      const cx = S / 2;
      const innerPx = (INNER_R / ROLL_R) * (S / 2);

      g.fillStyle = "#f2f1ec";
      g.fillRect(0, 0, S, S);

      for (let r = innerPx; r < S / 2 - 1; r += 2.1) {
        const a = 0.045 + rand() * 0.1 + (r % 29 < 2.2 ? 0.12 : 0);
        g.strokeStyle = `rgba(112,110,102,${a.toFixed(3)})`;
        g.lineWidth = rand() < 0.12 ? 1.6 : 0.8;
        g.beginPath();
        g.arc(cx, cx, r, 0, Math.PI * 2);
        g.stroke();
      }
      // spiral cut line
      g.strokeStyle = "rgba(90,88,80,0.35)";
      g.lineWidth = 1.4;
      g.beginPath();
      const turns = 26;
      for (let t = 0; t <= 1; t += 0.002) {
        const rr = innerPx + t * (S / 2 - innerPx - 2);
        const an = t * turns * Math.PI * 2;
        const px = cx + Math.cos(an) * rr;
        const py = cx + Math.sin(an) * rr;
        if (t === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.stroke();
      // inner shading
      const sh = g.createRadialGradient(cx, cx, innerPx, cx, cx, innerPx + 90);
      sh.addColorStop(0, "rgba(60,58,52,0.32)");
      sh.addColorStop(1, "rgba(60,58,52,0)");
      g.fillStyle = sh;
      g.beginPath();
      g.arc(cx, cx, S / 2, 0, Math.PI * 2);
      g.fill();
      // outer rim
      const rim = g.createRadialGradient(cx, cx, S / 2 - 26, cx, cx, S / 2);
      rim.addColorStop(0, "rgba(60,58,52,0)");
      rim.addColorStop(1, "rgba(60,58,52,0.22)");
      g.fillStyle = rim;
      g.beginPath();
      g.arc(cx, cx, S / 2, 0, Math.PI * 2);
      g.fill();

      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return tex;
    }

    // Blob shadow under the roll
    function buildBlobTexture() {
      const S = 256;
      const cv = document.createElement("canvas");
      cv.width = S;
      cv.height = S;
      const g = cv.getContext("2d")!;
      const gr = g.createRadialGradient(S / 2, S / 2, 6, S / 2, S / 2, S / 2);
      gr.addColorStop(0, "rgba(20,20,22,0.34)");
      gr.addColorStop(0.55, "rgba(20,20,22,0.14)");
      gr.addColorStop(1, "rgba(20,20,22,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, S, S);
      return new THREE.CanvasTexture(cv);
    }

    const atlasTex = buildAtlas();
    const capTex = buildCapTexture();
    const blobTex = buildBlobTexture();

    // ============================================================
    // The roll
    // ============================================================
    const rollGroup = new THREE.Group(); // yaw + position
    const spinner = new THREE.Group(); // rolls about local X
    rollGroup.add(spinner);
    scene.add(rollGroup);

    // The barrel wears the same atlas. With circumference == atlas length the
    // texture is glued to the mesh (repeat 1, constant 0.25 phase) and the card
    // touching the floor is always the exact card the ribbon prints there.
    const barrelTex = atlasTex.clone();
    barrelTex.needsUpdate = true;
    barrelTex.wrapS = THREE.RepeatWrapping;
    barrelTex.wrapT = THREE.ClampToEdgeWrapping;
    barrelTex.repeat.set(1, 1);
    barrelTex.offset.x = 0.25;
    const paperMat = new THREE.MeshStandardMaterial({
      map: barrelTex,
      roughness: 0.92,
      metalness: 0,
    });

    const barrelGeo = new THREE.CylinderGeometry(ROLL_R, ROLL_R, RIBBON_W, 96, 1, true);
    barrelGeo.rotateZ(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, paperMat);
    barrel.castShadow = true;
    spinner.add(barrel);

    const capMat = new THREE.MeshStandardMaterial({
      map: capTex,
      roughness: 0.95,
      metalness: 0,
    });
    const capGeo = new THREE.RingGeometry(INNER_R, ROLL_R, 96, 1);
    const capR = new THREE.Mesh(capGeo, capMat);
    capR.rotation.y = Math.PI / 2;
    capR.position.x = RIBBON_W / 2 + 0.001;
    capR.castShadow = true;
    spinner.add(capR);
    const capL = new THREE.Mesh(capGeo, capMat);
    capL.rotation.y = -Math.PI / 2;
    capL.position.x = -RIBBON_W / 2 - 0.001;
    capL.castShadow = true;
    spinner.add(capL);

    const coreGeo = new THREE.CylinderGeometry(INNER_R, INNER_R, RIBBON_W * 1.002, 48, 1, true);
    coreGeo.rotateZ(Math.PI / 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xdad7cf,
      roughness: 1,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    spinner.add(core);

    const blobGeo = new THREE.PlaneGeometry(ROLL_R * 3.4, RIBBON_W * 2.2);
    const blobMat = new THREE.MeshBasicMaterial({
      map: blobTex,
      transparent: true,
      depthWrite: false,
    });
    const blob = new THREE.Mesh(blobGeo, blobMat);
    blob.rotation.x = -Math.PI / 2;
    blob.renderOrder = 1;
    scene.add(blob);

    // ============================================================
    // Ribbon — one fixed-budget mesh, rebuilt in place each frame
    // ============================================================
    const VERTS = (MAX_SEG + 1) * 2;
    const posArr = new Float32Array(VERTS * 3);
    const nrmArr = new Float32Array(VERTS * 3);
    const uvArr = new Float32Array(VERTS * 2);
    const sArr = new Float32Array(VERTS);
    const idxArr = new Uint16Array(MAX_SEG * 6);
    for (let iq = 0; iq < MAX_SEG; iq++) {
      const v0 = iq * 2;
      idxArr[iq * 6 + 0] = v0;
      idxArr[iq * 6 + 1] = v0 + 1;
      idxArr[iq * 6 + 2] = v0 + 2;
      idxArr[iq * 6 + 3] = v0 + 1;
      idxArr[iq * 6 + 4] = v0 + 3;
      idxArr[iq * 6 + 5] = v0 + 2;
    }

    const posAttr = new THREE.BufferAttribute(posArr, 3).setUsage(THREE.DynamicDrawUsage);
    const nrmAttr = new THREE.BufferAttribute(nrmArr, 3).setUsage(THREE.DynamicDrawUsage);
    const uvAttr = new THREE.BufferAttribute(uvArr, 2).setUsage(THREE.DynamicDrawUsage);
    const sAttr = new THREE.BufferAttribute(sArr, 1).setUsage(THREE.DynamicDrawUsage);

    const ribbonGeo = new THREE.BufferGeometry();
    ribbonGeo.setAttribute("position", posAttr);
    ribbonGeo.setAttribute("normal", nrmAttr);
    ribbonGeo.setAttribute("uv", uvAttr);
    ribbonGeo.setAttribute("aS", sAttr);
    ribbonGeo.setIndex(new THREE.BufferAttribute(idxArr, 1));
    ribbonGeo.setDrawRange(0, 0);

    const uTailS = { value: 0 };

    const ribbonMat = new THREE.MeshStandardMaterial({
      map: atlasTex,
      roughness: 0.9,
      metalness: 0,
      side: THREE.DoubleSide,
    });
    ribbonMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTailS = uTailS;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nattribute float aS;\nvarying float vS;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvS = aS;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying float vS;\nuniform float uTailS;")
        .replace(
          "#include <map_fragment>",
          "#include <map_fragment>\n" +
            // tail dissolves into the floor before recycling
            "float tail = smoothstep(uTailS, uTailS + 3.0, vS);\n" +
            `diffuseColor.rgb = mix(${FLOOR_RGB}, diffuseColor.rgb, tail);`,
        );
    };

    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.frustumCulled = false;
    ribbon.receiveShadow = true;
    scene.add(ribbon);

    // ============================================================
    // Motion solver — heavy spring-damper, real rolling
    // ============================================================
    const pos = new THREE.Vector2(0, 0);
    const vel = new THREE.Vector2(0, 0);
    const target = new THREE.Vector2(0, 0);
    let yaw = 0;
    let sTotal = 0;
    const REV = 2 * Math.PI * ROLL_R;

    const SPRING = 16.0;
    const DAMP = 5.4;
    const MAX_SPEED = 9.0;

    // path history — preallocated ring of plain records
    const hx = new Float32Array(MAX_PTS);
    const hz = new Float32Array(MAX_PTS);
    const hs = new Float32Array(MAX_PTS);
    let head = -1; // index of newest
    let count = 0;

    const pushPoint = (x: number, z: number, s: number) => {
      head = (head + 1) % MAX_PTS;
      hx[head] = x;
      hz[head] = z;
      hs[head] = s;
      if (count < MAX_PTS) count++;
    };
    type Pt = { x: number; z: number; s: number };
    const getPt = (i: number, out: Pt) => {
      // i = 0 oldest … count-1 newest
      const k = (head - (count - 1) + i + MAX_PTS * 2) % MAX_PTS;
      out.x = hx[k]!;
      out.z = hz[k]!;
      out.s = hs[k]!;
    };

    pushPoint(0, 0, 0);

    const angleLerp = (a: number, b: number, t: number) => {
      let d = b - a;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      return a + d * t;
    };

    const _acc = new THREE.Vector2();
    const _dp = new THREE.Vector2();

    const stepMotion = (dt: number) => {
      _acc.copy(target).sub(pos).multiplyScalar(SPRING);
      _acc.addScaledVector(vel, -DAMP);
      vel.addScaledVector(_acc, dt);
      const sp = vel.length();
      if (sp > MAX_SPEED) vel.multiplyScalar(MAX_SPEED / sp);
      _dp.copy(vel).multiplyScalar(dt);
      const ds = _dp.length();
      if (ds > 1e-6) {
        pos.add(_dp);
        sTotal += ds;
        if (sp > 0.06) {
          const ty = Math.atan2(vel.x, vel.y); // vel.y is world z
          yaw = angleLerp(yaw, ty, 1 - Math.exp(-7 * dt));
        }
        // sample the path by distance, never by time
        const lx = hx[head]!;
        const lz = hz[head]!;
        const ddx = pos.x - lx;
        const ddz = pos.y - lz;
        if (ddx * ddx + ddz * ddz >= STEP * STEP) {
          pushPoint(pos.x, pos.y, sTotal);
        }
      }
    };

    // ============================================================
    // Ribbon rebuild — zero allocations
    // ============================================================
    const _a: Pt = { x: 0, z: 0, s: 0 };
    const _b: Pt = { x: 0, z: 0, s: 0 };
    const _c: Pt = { x: 0, z: 0, s: 0 };
    const CURL_MAX = 0.85; // radians of peel wrapped onto the barrel

    const writeVert = (
      vi: number,
      x: number,
      y: number,
      z: number,
      nx: number,
      ny: number,
      nz: number,
      u: number,
      vv: number,
      s: number,
    ) => {
      const p3 = vi * 3;
      const p2 = vi * 2;
      posArr[p3] = x;
      posArr[p3 + 1] = y;
      posArr[p3 + 2] = z;
      nrmArr[p3] = nx;
      nrmArr[p3 + 1] = ny;
      nrmArr[p3 + 2] = nz;
      uvArr[p2] = u;
      uvArr[p2 + 1] = vv;
      sArr[vi] = s;
    };

    const rebuildRibbon = () => {
      const n = count;
      if (n < 2) {
        ribbonGeo.setDrawRange(0, 0);
        return;
      }

      getPt(0, _a);
      const sTail = _a.s;
      const half = RIBBON_W / 2;
      let vi = 0;
      const uSpan = CARD_LEN * ATLAS_N;
      const uBase = Math.floor(sTail / uSpan) * uSpan;

      // smoothed forward from yaw — stable even when velocity crosses zero
      const fx = Math.sin(yaw);
      const fz = Math.cos(yaw);
      const sxc = fz;
      const szc = -fx;

      // ---- flat printed trail ----
      let ptx = 0;
      let ptz = 0;
      let hasPrev = false;
      for (let i = 0; i < n; i++) {
        getPt(i, _b);
        let tx: number;
        let tz: number;
        if (i === n - 1) {
          // head tangent from smoothed yaw, never from noisy point deltas
          tx = fx;
          tz = fz;
        } else {
          const i0 = i > 0 ? i - 1 : 0;
          const i1 = i + 1;
          getPt(i0, _a);
          getPt(i1, _c);
          tx = _c.x - _a.x;
          tz = _c.z - _a.z;
        }
        const tl = Math.sqrt(tx * tx + tz * tz);
        if (tl < 1e-4) {
          // degenerate delta at a reversal: reuse the previous tangent
          tx = hasPrev ? ptx : fx;
          tz = hasPrev ? ptz : fz;
        } else {
          tx /= tl;
          tz /= tl;
        }
        // continuity guard: never let the strip twist through a flip
        if (hasPrev && tx * ptx + tz * ptz < 0) {
          tx = ptx;
          tz = ptz;
        }
        ptx = tx;
        ptz = tz;
        hasPrev = true;
        const sx = tz;
        const sz = -tx; // side vector on the floor

        // width taper at the tail so recycling is invisible
        let w = half;
        const fromTail = _b.s - sTail;
        if (fromTail < 3.0) w *= fromTail / 3.0;

        // newer paper lies on top; the head gets an extra ramp so fresh paper
        // laid over a just-reversed spot never z-fights with itself
        let y = 0.012 + (_b.s - sTail) * 0.0008;
        const headBlend = 1 - (sTotal - _b.s) / 1.5;
        if (headBlend > 0) y += 0.0035 * headBlend;
        const u = (_b.s - uBase) / uSpan;
        writeVert(vi++, _b.x + sx * w, y, _b.z + sz * w, 0, 1, 0, u, 0, _b.s - uBase);
        writeVert(vi++, _b.x - sx * w, y, _b.z - sz * w, 0, 1, 0, u, 1, _b.s - uBase);
      }

      // ---- bridge to the live contact point ----
      const yTop = 0.012 + (sTotal - sTail) * 0.0008 + 0.0035;
      const uC = (sTotal - uBase) / uSpan;
      writeVert(vi++, pos.x + sxc * half, yTop, pos.y + szc * half, 0, 1, 0, uC, 0, sTotal - uBase);
      writeVert(vi++, pos.x - sxc * half, yTop, pos.y - szc * half, 0, 1, 0, uC, 1, sTotal - uBase);

      // ---- peel: unprinted paper coming down the front of the barrel ----
      // this is the physically correct side — the card rolling down the front
      // is exactly the card the atlas shows there, so the hand-off is seamless
      for (let j = 1; j <= CURL_SEG; j++) {
        const th = (j / CURL_SEG) * CURL_MAX;
        const rr = ROLL_R + 0.012;
        const px = pos.x + fx * Math.sin(th) * rr;
        const pz = pos.y + fz * Math.sin(th) * rr;
        const py = yTop + rr * (1 - Math.cos(th));
        // paper-face normal, continuous with the flat trail at th = 0
        const nx = -fx * Math.sin(th);
        const nyv = Math.cos(th);
        const nz = -fz * Math.sin(th);
        const sHere = sTotal + th * ROLL_R;
        const uH = (sHere - uBase) / uSpan;
        writeVert(vi++, px + sxc * half, py, pz + szc * half, nx, nyv, nz, uH, 0, sHere - uBase);
        writeVert(vi++, px - sxc * half, py, pz - szc * half, nx, nyv, nz, uH, 1, sHere - uBase);
      }

      const segs = vi / 2 - 1;
      ribbonGeo.setDrawRange(0, segs * 6);
      posAttr.needsUpdate = true;
      nrmAttr.needsUpdate = true;
      uvAttr.needsUpdate = true;
      sAttr.needsUpdate = true;

      uTailS.value = sTail - uBase;
    };

    // ============================================================
    // Input — pointer on the floor plane, with idle autopilot
    // ============================================================
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2(0, 0);
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    let pointerActive = false;
    let lastPointerT = -1e9;
    let autoAngle = Math.PI * 0.25;

    const onPointer = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      pointerActive = true;
      lastPointerT = performance.now();
    };
    container.addEventListener("pointermove", onPointer, { passive: true });
    container.addEventListener("pointerdown", onPointer, { passive: true });

    // ---- click toggles the roll; drags don't ----
    let paused = false;
    let downX = 0;
    let downY = 0;
    let downT = 0;

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
      downT = performance.now();
    };
    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      if (dx * dx + dy * dy < 64 && performance.now() - downT < 450) {
        paused = !paused;
      }
    };
    container.addEventListener("pointerdown", onPointerDown, { passive: true });
    container.addEventListener("pointerup", onPointerUp, { passive: true });

    const updateTarget = (t: number, dt: number) => {
      const idle = performance.now() - lastPointerT > 3200;
      if (pointerActive && !idle) {
        raycaster.setFromCamera(ndc, camera);
        if (raycaster.ray.intersectPlane(floorPlane, hit)) {
          target.set(hit.x, hit.z);
        }
      } else {
        // wandering autopilot — always in motion, never a straight line
        autoAngle += dt * (0.34 + 0.5 * Math.sin(t * 0.31) + 0.3 * Math.sin(t * 0.113 + 2.1));
        target.set(pos.x + Math.sin(autoAngle) * 5.2, pos.y + Math.cos(autoAngle) * 5.2);
      }
    };

    // ============================================================
    // Camera
    // ============================================================
    const camOffset = new THREE.Vector3(7.6, 8.8, 10.8);
    const camPos = new THREE.Vector3();
    const lookAt = new THREE.Vector3(0, 0.6, 0);
    const _desired = new THREE.Vector3();
    const INTRO_DUR = 2.2;
    let introT = 0;

    const introZoom = () => {
      // gsap power3.out: 1.5 → 1 over INTRO_DUR
      const t = Math.min(introT / INTRO_DUR, 1);
      const e = 1 - (1 - t) ** 3;
      return 1.5 - 0.5 * e;
    };

    const updateCamera = (dt: number) => {
      _desired.set(pos.x, 0, pos.y).addScaledVector(camOffset, introZoom());
      const k = 1 - Math.exp(-2.6 * dt);
      camPos.lerp(_desired, k);
      _desired.set(pos.x, 0.55, pos.y);
      lookAt.lerp(_desired, k);
      camera.position.copy(camPos);
      camera.lookAt(lookAt);
    };

    // ============================================================
    // Pre-roll: lay a trail before the first frame
    // ============================================================
    let t0 = 0;
    for (let i = 0; i < 560; i++) {
      t0 += 1 / 60;
      autoAngle += (1 / 60) * (0.34 + 0.5 * Math.sin(t0 * 0.31) + 0.3 * Math.sin(t0 * 0.113 + 2.1));
      target.set(pos.x + Math.sin(autoAngle) * 5.2, pos.y + Math.cos(autoAngle) * 5.2);
      stepMotion(1 / 60);
    }
    camPos.set(pos.x, 0, pos.y).addScaledVector(camOffset, 1.5);
    lookAt.set(pos.x, 0.55, pos.y);

    // ============================================================
    // Main loop — fixed order, no allocations
    // ============================================================
    const clock = new THREE.Clock();
    let elapsed = 0;
    let animationFrameId = 0;

    const frame = () => {
      animationFrameId = requestAnimationFrame(frame);
      // sub-step the spring solver so slow renderers stay real-time instead of
      // going slow-motion; each sub-step is small enough to keep Euler stable
      const dt = Math.min(clock.getDelta(), 1 / 8);
      elapsed += dt;
      introT += dt;

      if (!paused) {
        updateTarget(elapsed, dt);
        const steps = Math.min(8, Math.ceil(dt * 60));
        const h = dt / steps;
        for (let s = 0; s < steps; s++) stepMotion(h);

        rollGroup.position.set(pos.x, ROLL_R, pos.y);
        rollGroup.rotation.y = yaw;
        spinner.rotation.x = (sTotal % REV) / ROLL_R;

        rebuildRibbon();

        blob.position.set(pos.x, 0.006, pos.y);
        blob.rotation.z = yaw - Math.PI / 2;

        floor.position.set(pos.x, 0, pos.y);
        sun.position.set(pos.x + 5, 10, pos.y + 4);
        sun.target.position.set(pos.x, 0, pos.y);
      }

      updateCamera(dt);

      renderer.render(scene, camera);
    };
    animationFrameId = requestAnimationFrame(frame);

    const resizeObserver = new ResizeObserver(() => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      container.removeEventListener("pointermove", onPointer);
      container.removeEventListener("pointerdown", onPointer);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointerup", onPointerUp);
      barrelGeo.dispose();
      capGeo.dispose();
      coreGeo.dispose();
      blobGeo.dispose();
      floorGeo.dispose();
      ribbonGeo.dispose();
      paperMat.dispose();
      capMat.dispose();
      coreMat.dispose();
      blobMat.dispose();
      floorMat.dispose();
      ribbonMat.dispose();
      atlasTex.dispose();
      barrelTex.dispose();
      capTex.dispose();
      blobTex.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative size-full cursor-grab touch-none overflow-hidden bg-[#eaeaec] select-none active:cursor-grabbing"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block" />
    </div>
  );
};
