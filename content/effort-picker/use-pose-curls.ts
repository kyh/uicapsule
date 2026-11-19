"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { NormalizedLandmark, PoseLandmarker } from "@mediapipe/tasks-vision";

const WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

const loadVision = () => import("@mediapipe/tasks-vision");

interface Arm {
  shoulder: number;
  elbow: number;
  wrist: number;
}

const ARMS: readonly Arm[] = [
  { elbow: 13, shoulder: 11, wrist: 15 },
  { elbow: 14, shoulder: 12, wrist: 16 },
];

const MIN_VISIBILITY = 0.5;
const REP_LIFT = 0.6;

const ARM_SWITCH_MARGIN = 0.12;
const ARM_SWITCH_FRAMES = 10;
const SMOOTHING = 0.35;
const POSE_LOST_FRAMES = 12;

interface Point2 {
  x: number;
  y: number;
}

interface Chain<T> {
  shoulder: T;
  elbow: T;
  wrist: T;
}

interface ArmPose {
  arm: Arm;
  confidence: number;
  image: Chain<Point2>;
}

const readArm = (image: NormalizedLandmark[], arm: Arm) => {
  const shoulder = image[arm.shoulder];
  const elbow = image[arm.elbow];
  const wrist = image[arm.wrist];

  if (!shoulder || !elbow || !wrist) {
    return null;
  }

  const confidence = Math.min(shoulder.visibility, elbow.visibility, wrist.visibility);

  if (confidence < MIN_VISIBILITY) {
    return null;
  }

  return { arm, confidence, image: { elbow, shoulder, wrist } };
};

const readArms = (image: NormalizedLandmark[] | undefined, tracked: Arm | null) => {
  let held: ArmPose | null = null;
  let clearest: ArmPose | null = null;

  if (image) {
    for (const arm of ARMS) {
      const reading = readArm(image, arm);

      if (!reading) {
        continue;
      }

      if (arm === tracked) {
        held = reading;
      }

      if (!clearest || reading.confidence > clearest.confidence) {
        clearest = reading;
      }
    }
  }

  return { clearest, held };
};

const pickContender = (clearest: ArmPose | null, held: ArmPose | null, tracked: Arm | null) =>
  clearest &&
  clearest.arm !== tracked &&
  (!held || clearest.confidence > held.confidence + ARM_SWITCH_MARGIN)
    ? clearest
    : null;

const mix = (previous: number, next: number) => previous + (next - previous) * SMOOTHING;
const blendPoint = (a: Point2, b: Point2) => ({ x: mix(a.x, b.x), y: mix(a.y, b.y) });

const blendPose = (previous: ArmPose, next: ArmPose) => ({
  ...next,
  image: {
    elbow: blendPoint(previous.image.elbow, next.image.elbow),
    shoulder: blendPoint(previous.image.shoulder, next.image.shoulder),
    wrist: blendPoint(previous.image.wrist, next.image.wrist),
  },
});

const wristLift = ({ shoulder, elbow, wrist }: Chain<Point2>, aspect: number) => {
  const upperArm = Math.hypot((shoulder.x - elbow.x) * aspect, shoulder.y - elbow.y);

  if (upperArm === 0) {
    return null;
  }

  return (elbow.y - wrist.y) / upperArm;
};

const drawArm = (
  canvas: HTMLCanvasElement | null,
  video: HTMLVideoElement,
  chain: Chain<Point2> | null,
) => {
  if (!canvas) {
    return;
  }

  const width = video.videoWidth;
  const height = video.videoHeight;

  if (width === 0 || height === 0) {
    return;
  }

  if (canvas.width !== width) {
    canvas.width = width;
  }

  if (canvas.height !== height) {
    canvas.height = height;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.clearRect(0, 0, width, height);

  if (!chain) {
    return;
  }

  const points = [chain.shoulder, chain.elbow, chain.wrist].map((joint) => ({
    x: joint.x * width,
    y: joint.y * height,
  }));

  const [shoulder, elbow, wrist] = points;

  if (!shoulder || !elbow || !wrist) {
    return;
  }

  context.lineWidth = 5;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "rgba(167, 139, 250, 0.9)";
  context.shadowColor = "rgba(139, 92, 246, 0.9)";
  context.shadowBlur = 12;
  context.beginPath();
  context.moveTo(shoulder.x, shoulder.y);
  context.lineTo(elbow.x, elbow.y);
  context.lineTo(wrist.x, wrist.y);
  context.stroke();

  context.fillStyle = "#f5f3ff";

  for (const point of points) {
    context.beginPath();
    context.arc(point.x, point.y, 4.5, 0, Math.PI * 2);
    context.fill();
  }
};

type PoseState =
  | { status: "idle" | "loading" }
  | { status: "tracking"; posed: boolean }
  | { status: "error"; error: string };

export type PoseStatus = PoseState["status"];

interface UsePoseCurlsOptions {
  /** The camera only spins up when the card is on screen — this is the switch. */
  enabled: boolean;
  /** Fired once per completed curl of the tracked arm. */
  onRep: () => void;
}

interface UsePoseCurls {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  status: PoseStatus;
  error: string | null;
  posed: boolean;
  retry: () => void;
}

export const usePoseCurls = ({ enabled, onRep }: UsePoseCurlsOptions) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [attempt, setAttempt] = useState(0);
  const request = enabled ? attempt : null;
  const [activeRequest, setActiveRequest] = useState(request);
  const [pose, setPose] = useState<PoseState>({ status: enabled ? "loading" : "idle" });

  if (activeRequest !== request) {
    setActiveRequest(request);
    setPose({ status: request === null ? "idle" : "loading" });
  }

  const onRepRef = useRef(onRep);
  useEffect(() => {
    onRepRef.current = onRep;
  }, [onRep]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  useEffect(() => {
    if (request === null) {
      return;
    }

    let cancelled = false;
    let frame = 0;
    let stream: MediaStream | null = null;
    let landmarker: PoseLandmarker | null = null;
    let flexed = false;
    let extreme = 0;
    let tracked: Arm | null = null;
    let averaged: ArmPose | null = null;
    let challenger: Arm | null = null;
    let challengeFrames = 0;
    let lostFrames = 0;
    let reported = false;

    const report = (value: boolean) => {
      if (value === reported) {
        return;
      }

      reported = value;
      setPose({ posed: value, status: "tracking" });
    };

    const fail = (cause: unknown) => {
      if (cancelled) {
        return;
      }

      cancelAnimationFrame(frame);
      landmarker?.close();
      landmarker = null;

      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }

      setPose({ error: cause instanceof Error ? cause.message : String(cause), status: "error" });
    };

    const pickSubject = (image: NormalizedLandmark[] | undefined) => {
      const { held, clearest } = readArms(image, tracked);
      const contender = pickContender(clearest, held, tracked);

      if (contender && contender.arm === challenger) {
        challengeFrames += 1;
      } else {
        challengeFrames = contender ? 1 : 0;
      }

      challenger = contender ? contender.arm : null;

      return contender && (!held || challengeFrames >= ARM_SWITCH_FRAMES) ? contender : held;
    };

    const lose = (element: HTMLVideoElement) => {
      lostFrames += 1;

      if (lostFrames >= POSE_LOST_FRAMES) {
        report(false);
        tracked = null;
        averaged = null;
      }

      drawArm(canvasRef.current, element, null);
    };

    const score = (lift: number, changed: boolean) => {
      if (changed) {
        flexed = false;
        extreme = lift;

        return;
      }

      if (flexed) {
        extreme = Math.max(extreme, lift);

        if (extreme - lift >= REP_LIFT) {
          flexed = false;
          extreme = lift;
        }

        return;
      }

      extreme = Math.min(extreme, lift);

      if (lift - extreme >= REP_LIFT) {
        flexed = true;
        extreme = lift;
        onRepRef.current();
      }
    };

    const boot = async () => {
      const { FilesetResolver, PoseLandmarker } = await loadVision();

      if (cancelled) {
        return;
      }

      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user", height: 480, width: 640 },
      });

      if (cancelled) {
        for (const track of stream.getTracks()) {
          track.stop();
        }

        return;
      }

      const video = videoRef.current;

      if (!video) {
        for (const track of stream.getTracks()) {
          track.stop();
        }

        return;
      }

      video.srcObject = stream;
      await video.play();

      if (cancelled) {
        return;
      }

      const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);

      if (cancelled) {
        return;
      }

      landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: { delegate: "GPU", modelAssetPath: MODEL_URL },
        numPoses: 1,
        runningMode: "VIDEO",
      });

      if (cancelled) {
        landmarker.close();

        return;
      }

      setPose({ posed: false, status: "tracking" });

      let lastVideoTime = -1;
      let lastTimestamp = 0;

      const detect = () => {
        frame = requestAnimationFrame(detect);
        const element = videoRef.current;
        const model = landmarker;

        if (!element || !model || element.readyState < 2) {
          return;
        }

        if (element.currentTime === lastVideoTime) {
          return;
        }

        lastVideoTime = element.currentTime;

        const now = performance.now();
        const timestamp = now > lastTimestamp ? now : lastTimestamp + 1;
        lastTimestamp = timestamp;

        const result = model.detectForVideo(element, timestamp);
        const [image] = result.landmarks;

        const subject = pickSubject(image);

        if (!subject) {
          lose(element);

          return;
        }

        lostFrames = 0;
        report(true);

        const changed = subject.arm !== tracked;

        if (changed) {
          tracked = subject.arm;
          averaged = null;
          challenger = null;
          challengeFrames = 0;
        }

        const smoothed = averaged ? blendPose(averaged, subject) : subject;
        averaged = smoothed;
        drawArm(canvasRef.current, element, smoothed.image);

        const aspect = (element.videoWidth || 1) / (element.videoHeight || 1);
        const lift = wristLift(smoothed.image, aspect);

        if (lift === null) {
          return;
        }

        score(lift, changed);
      };

      detect();
    };

    const start = async () => {
      try {
        await boot();
      } catch (error) {
        fail(error);
      }
    };

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      landmarker?.close();

      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }
    };
  }, [request]);

  return {
    canvasRef,
    error: pose.status === "error" ? pose.error : null,
    posed: pose.status === "tracking" && pose.posed,
    retry,
    status: pose.status,
    videoRef,
  } satisfies UsePoseCurls;
};
