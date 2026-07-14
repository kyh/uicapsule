"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { NormalizedLandmark, PoseLandmarker } from "@mediapipe/tasks-vision";

/**
 * Webcam bicep-curl detector. Owns the camera stream, the MediaPipe pose model,
 * the detection loop and the skeleton overlay; hands the caller nothing but reps.
 *
 * It watches ONE arm — whichever of the two the camera can see best, re-picked
 * every frame. Counting both doubled the score for the same effort and made the
 * overlay a diagram; one arm is one unit of work, and the thing you're supposed
 * to do is legible from the picture without a caption.
 *
 * A rep is an elbow-angle round trip with hysteresis: the arm has to open past
 * EXTENDED_ANGLE to re-arm and close past FLEXED_ANGLE to fire, so an elbow
 * hovering at the boundary can't buzz out free effort.
 *
 * Angles are computed in the video's own aspect: MediaPipe's landmarks are
 * normalized to [0,1] on each axis, so on a 16:9 frame an x-delta is worth less
 * than the same y-delta in real space. Un-distorting x before the dot product is
 * the difference between a curl reading as 60° and reading as 90°.
 */

/** The wasm bundle + model the detector streams in on first open. Both are CDN
 * assets: a ~3MB model has no business in the page's initial payload, and the
 * card doesn't mount until the user asks for it. */
const WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

/** MediaPipe pose landmark indices for each arm. The detector commits to one. */
type Arm = { shoulder: number; elbow: number; wrist: number };
const ARMS: readonly Arm[] = [
  { shoulder: 11, elbow: 13, wrist: 15 },
  { shoulder: 12, elbow: 14, wrist: 16 },
];

/** Joints read below this confidence are dropped — a guessed wrist curls on its own. */
const MIN_VISIBILITY = 0.5;
/** Elbow closed past this (degrees) completes a rep. */
const FLEXED_ANGLE = 70;
/** Elbow opened past this (degrees) re-arms the arm for the next one. The gap
 * between the two is the hysteresis band: half-reps at the boundary can't buzz. */
const EXTENDED_ANGLE = 140;

export type PoseStatus = "idle" | "loading" | "tracking" | "error";

type UsePoseCurlsOptions = {
  /** The camera only spins up when the card is on screen — this is the switch. */
  enabled: boolean;
  /** Fired once per completed curl of the tracked arm. */
  onRep: () => void;
};

type UsePoseCurls = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  status: PoseStatus;
  /** Set alongside status "error"; already human-readable. */
  error: string | null;
  /** True once a full arm is actually in frame — "the camera is on" and "I can
   * see you" are different promises. */
  posed: boolean;
  /** Re-run startup after a denial or a failed model fetch. */
  retry: () => void;
};

export const usePoseCurls = ({ enabled, onRep }: UsePoseCurlsOptions): UsePoseCurls => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<PoseStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [posed, setPosed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // The detection loop outlives every render it starts in, so it reads the rep
  // handler through a ref rather than closing over a stale one.
  const onRepRef = useRef(onRep);
  useEffect(() => {
    onRepRef.current = onRep;
  }, [onRep]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      setPosed(false);
      return;
    }

    let cancelled = false;
    let frame = 0;
    let stream: MediaStream | null = null;
    let landmarker: PoseLandmarker | null = null;
    /** Latch: true while the tracked elbow is closed and its rep already scored. */
    let flexed = false;
    /** The arm currently being watched, so a hand-off between arms can be spotted. */
    let tracked: Arm | null = null;

    setStatus("loading");
    setError(null);
    setPosed(false);

    const fail = (reason: unknown) => {
      if (cancelled) return;
      setError(reason instanceof Error ? reason.message : String(reason));
      setStatus("error");
    };

    const start = async () => {
      // The model is a few MB of wasm — it's dynamically imported so it only
      // costs anything for the people who actually open this variant.
      const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");

      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      if (cancelled) return;

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      if (cancelled) return;

      const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
      landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numPoses: 1,
      });
      if (cancelled) {
        landmarker.close();
        return;
      }

      setStatus("tracking");

      let lastVideoTime = -1;
      let lastTimestamp = 0;

      const detect = () => {
        frame = requestAnimationFrame(detect);
        const element = videoRef.current;
        const model = landmarker;
        if (!element || !model || element.readyState < 2) return;
        if (element.currentTime === lastVideoTime) return;
        lastVideoTime = element.currentTime;

        // MediaPipe rejects a timestamp that doesn't advance.
        const now = performance.now();
        const timestamp = now > lastTimestamp ? now : lastTimestamp + 1;
        lastTimestamp = timestamp;

        const result = model.detectForVideo(element, timestamp);
        const landmarks = result.landmarks[0];
        const arm = landmarks ? clearestArm(landmarks) : null;
        drawArm(canvasRef.current, element, landmarks, arm);

        setPosed(arm !== null);
        if (!landmarks || !arm) {
          tracked = null;
          return;
        }

        const aspect = (element.videoWidth || 1) / (element.videoHeight || 1);
        const angle = elbowAngle(landmarks, arm, aspect);
        if (angle === null) return;

        // Switching arms mid-set adopts the new elbow's current state rather than
        // scoring on the hand-off: dropping a flexed left arm and raising an
        // extended right one is a change of subject, not a rep.
        if (arm !== tracked) {
          tracked = arm;
          flexed = angle < FLEXED_ANGLE;
          return;
        }

        if (!flexed && angle < FLEXED_ANGLE) {
          flexed = true;
          onRepRef.current();
        } else if (flexed && angle > EXTENDED_ANGLE) {
          flexed = false;
        }
      };

      detect();
    };

    start().catch(fail);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      landmarker?.close();
      if (stream) for (const track of stream.getTracks()) track.stop();
    };
  }, [enabled, attempt]);

  return { videoRef, canvasRef, status, error, posed, retry };
};

/**
 * The arm the camera has the best look at — the one whose weakest joint is still
 * the most confident. Null when neither arm is fully in frame, which is what the
 * card waits on before it starts counting anyone in.
 */
const clearestArm = (landmarks: NormalizedLandmark[]): Arm | null => {
  let best: Arm | null = null;
  let bestConfidence = MIN_VISIBILITY;

  for (const arm of ARMS) {
    const shoulder = landmarks[arm.shoulder];
    const elbow = landmarks[arm.elbow];
    const wrist = landmarks[arm.wrist];
    if (!shoulder || !elbow || !wrist) continue;

    // A chain is only as visible as its worst joint: a crisp shoulder is no help
    // if the wrist is a guess.
    const confidence = Math.min(shoulder.visibility, elbow.visibility, wrist.visibility);
    if (confidence > bestConfidence) {
      best = arm;
      bestConfidence = confidence;
    }
  }

  return best;
};

/**
 * Interior angle at the elbow, in degrees, or null if any joint of the chain is
 * a guess. `aspect` un-squashes the normalized x axis back into real proportions.
 */
const elbowAngle = (landmarks: NormalizedLandmark[], arm: Arm, aspect: number): number | null => {
  const shoulder = landmarks[arm.shoulder];
  const elbow = landmarks[arm.elbow];
  const wrist = landmarks[arm.wrist];
  if (!shoulder || !elbow || !wrist) return null;
  if (
    shoulder.visibility < MIN_VISIBILITY ||
    elbow.visibility < MIN_VISIBILITY ||
    wrist.visibility < MIN_VISIBILITY
  ) {
    return null;
  }

  const ax = (shoulder.x - elbow.x) * aspect;
  const ay = shoulder.y - elbow.y;
  const bx = (wrist.x - elbow.x) * aspect;
  const by = wrist.y - elbow.y;

  const magnitude = Math.hypot(ax, ay) * Math.hypot(bx, by);
  if (magnitude === 0) return null;

  const cosine = Math.min(Math.max((ax * bx + ay * by) / magnitude, -1), 1);
  return (Math.acos(cosine) * 180) / Math.PI;
};

/**
 * The overlay: the tracked arm and nothing else — shoulder, elbow, wrist, lit in
 * violet, drawn in the video's intrinsic pixels. Drawing only the arm being
 * scored means the picture answers "what is this thing watching?" on its own.
 * The canvas and the video carry the same aspect and the same CSS mirror, so the
 * drawing stays registered on the body without any maths here.
 */
const drawArm = (
  canvas: HTMLCanvasElement | null,
  video: HTMLVideoElement,
  landmarks: NormalizedLandmark[] | undefined,
  arm: Arm | null,
): void => {
  if (!canvas) return;
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (width === 0 || height === 0) return;
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, width, height);
  if (!landmarks || !arm) return;

  const joints = [landmarks[arm.shoulder], landmarks[arm.elbow], landmarks[arm.wrist]];
  const points: { x: number; y: number }[] = [];
  for (const joint of joints) {
    if (!joint) return;
    points.push({ x: joint.x * width, y: joint.y * height });
  }
  const [shoulder, elbow, wrist] = points;
  if (!shoulder || !elbow || !wrist) return;

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
