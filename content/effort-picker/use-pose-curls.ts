"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { NormalizedLandmark, PoseLandmarker } from "@mediapipe/tasks-vision";

/**
 * Webcam bicep-curl detector. Owns the camera stream, the MediaPipe pose model,
 * the detection loop and the skeleton overlay; hands the caller nothing but reps.
 *
 * It watches ONE arm — whichever of the two the camera has the best look at.
 * Counting both doubled the score for the same effort and made the overlay a
 * diagram; one arm is one unit of work, and the thing you're supposed to do is
 * legible from the picture without a caption.
 *
 * What it measures is not the elbow angle — it's the WRIST RISING. The angle was
 * tried twice against live sets and failed both times, the same way: a strict
 * curl faced toward the camera ends with the forearm pointing at the lens, and
 * pointing at the lens is exactly where a webcam can't measure. In image space
 * the projected forearm collapses and the 2D angle goes still; in world space the
 * lite model's z is too soft to carry it, and the 3D angle traversed as little as
 * a sixth of its real range on recorded slow reps — while fast sloppy swings,
 * which travel *across* the frame, scored fine. A rep counter that rewards
 * cheating and ignores form is a broken bit. Wrist height relative to the elbow,
 * in plain image pixels, moves through its full range on every real curl at any
 * speed and orientation, and never needs z; divided by the upper-arm length it's
 * also indifferent to how far from the camera you stand.
 *
 * A rep is a round trip with hysteresis, measured against the wrist's own recent
 * extremes rather than absolute heights — the wrist must rise REP_LIFT above its
 * recent low to fire and fall REP_LIFT below its recent high to re-arm, so
 * nothing here assumes where "arm down" hangs on any given body or framing, and
 * jitter at either end can't buzz out free reps.
 *
 * Two more things keep the reading still:
 *
 * - The tracked arm is sticky. Whoever is clearest *this frame* is the wrong
 *   subject: face a camera square on and the two arms are within noise of each
 *   other, so the winner flips every few frames — and every flip re-arms the rep
 *   latch, which is a swallowed rep and an overlay hopping between arms.
 * - Joints are averaged across frames. The lite model shivers a pixel or two on a
 *   perfectly still arm, and the overlay shows every bit of it.
 */

/** The wasm bundle + model the detector streams in on first open. Both are CDN
 * assets: a ~3MB model has no business in the page's initial payload, and the
 * card doesn't mount until the user asks for it.
 *
 * The wasm version must match the installed `@mediapipe/tasks-vision` — the two
 * halves are one build, and a loader talking to a different runtime's exports is
 * not a combination anyone tests. */
const WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
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
/** How far the wrist has to travel, in upper-arm lengths, to score — measured
 * against its own recent extreme rather than any absolute height. A full curl
 * lifts the wrist from a forearm below the elbow to a forearm above it: around
 * two upper-arm lengths of travel, and never less than one even lazily done in a
 * cramped frame. Landmark jitter on a still arm is a few hundredths. Sat between
 * the two, closer to the noise: the bit wants every honest rep counted, and the
 * drain already punishes anyone gaming half-lifts harder than a strict counter
 * would. */
const REP_LIFT = 0.6;

/** How much clearer the other arm has to look, and for how many frames running,
 * before the detector changes subject. Roughly a fifth of a second of being
 * decisively better — enough that a real hand-off still lands quickly, far more
 * than the frame-to-frame noise that used to trigger one. */
const ARM_SWITCH_MARGIN = 0.12;
const ARM_SWITCH_FRAMES = 10;
/** Weight of the newest frame in the running joint average. Low enough to settle
 * the shiver, high enough that the overlay doesn't lag the arm it's drawn on. */
const SMOOTHING = 0.35;
/** Frames without a readable arm before the card is told it lost you. A single
 * dropped detection is a blink, not an exit — and `posed` gates the count-in. */
const POSE_LOST_FRAMES = 12;

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
    /** Latch: true while the tracked wrist is up and its rep already scored. */
    let flexed = false;
    /** The furthest the wrist has got since the latch last flipped — its low
     * while the arm is armed, its high while it's up. The lift is measured from
     * here, which is what keeps the count free of absolute heights. */
    let extreme = 0;
    /** The arm currently being watched, and its running average. */
    let tracked: Arm | null = null;
    let averaged: ArmPose | null = null;
    /** The other arm's bid to become the subject, and how long it's been making it. */
    let challenger: Arm | null = null;
    let challengeFrames = 0;
    let lostFrames = 0;
    /** Mirrors `posed` so the loop can skip the setState entirely on the ~59
     * frames a second where the answer hasn't changed. */
    let reported = false;

    setStatus("loading");
    setError(null);
    setPosed(false);

    const report = (value: boolean) => {
      if (value === reported) return;
      reported = value;
      setPosed(value);
    };

    const fail = (cause: unknown) => {
      if (cancelled) return;
      setError(cause instanceof Error ? cause.message : String(cause));
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
        const image = result.landmarks[0];

        // Whichever arm we're on stays the subject unless the other one is
        // decisively clearer for long enough to have earned the hand-off.
        let held: ArmPose | null = null;
        let clearest: ArmPose | null = null;
        if (image) {
          for (const arm of ARMS) {
            const pose = readArm(image, arm);
            if (!pose) continue;
            if (arm === tracked) held = pose;
            if (!clearest || pose.confidence > clearest.confidence) clearest = pose;
          }
        }

        const contender =
          clearest &&
          clearest.arm !== tracked &&
          (!held || clearest.confidence > held.confidence + ARM_SWITCH_MARGIN)
            ? clearest
            : null;

        if (contender && contender.arm === challenger) challengeFrames += 1;
        else challengeFrames = contender ? 1 : 0;
        challenger = contender ? contender.arm : null;

        const subject =
          contender && (!held || challengeFrames >= ARM_SWITCH_FRAMES) ? contender : held;

        if (!subject) {
          lostFrames += 1;
          if (lostFrames >= POSE_LOST_FRAMES) {
            report(false);
            tracked = null;
            averaged = null;
          }
          drawArm(canvasRef.current, element, null);
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

        const pose = averaged ? blendPose(averaged, subject) : subject;
        averaged = pose;
        drawArm(canvasRef.current, element, pose.image);

        const aspect = (element.videoWidth || 1) / (element.videoHeight || 1);
        const lift = wristLift(pose.image, aspect);
        if (lift === null) return;

        // Switching arms mid-set starts the new wrist's trip from where it is
        // rather than scoring on the hand-off: dropping a raised left arm and
        // hanging an extended right one is a change of subject, not a rep.
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

type Point2 = { x: number; y: number };
/** Shoulder → elbow → wrist. The only shape any of the maths below cares about. */
type Chain<T> = { shoulder: T; elbow: T; wrist: T };

/** One arm, read for a single frame: joints for the lift and the overlay, and
 * how much of the chain the model was actually sure about. */
type ArmPose = {
  arm: Arm;
  /** The chain's *worst* joint — a crisp shoulder is no help if the wrist is a guess. */
  confidence: number;
  /** Normalized to [0,1] on each axis, in the video's own frame. */
  image: Chain<Point2>;
};

const readArm = (image: NormalizedLandmark[], arm: Arm): ArmPose | null => {
  const shoulder = image[arm.shoulder];
  const elbow = image[arm.elbow];
  const wrist = image[arm.wrist];
  if (!shoulder || !elbow || !wrist) return null;

  const confidence = Math.min(shoulder.visibility, elbow.visibility, wrist.visibility);
  if (confidence < MIN_VISIBILITY) return null;

  return { arm, confidence, image: { shoulder, elbow, wrist } };
};

const mix = (previous: number, next: number) => previous + (next - previous) * SMOOTHING;
const blendPoint = (a: Point2, b: Point2): Point2 => ({ x: mix(a.x, b.x), y: mix(a.y, b.y) });

const blendPose = (previous: ArmPose, next: ArmPose): ArmPose => ({
  ...next,
  image: {
    shoulder: blendPoint(previous.image.shoulder, next.image.shoulder),
    elbow: blendPoint(previous.image.elbow, next.image.elbow),
    wrist: blendPoint(previous.image.wrist, next.image.wrist),
  },
});

/**
 * How far the wrist rides above the elbow, in upper-arm lengths. Positive is up:
 * an arm hanging extended sits near -1, a finished curl near +1. `aspect`
 * un-squashes the normalized x axis so the upper-arm length is measured in real
 * proportions — landmarks are normalized per-axis, and on a 16:9 frame a
 * horizontal upper arm would otherwise read barely half as long as a vertical
 * one and double the lift it's dividing into.
 */
const wristLift = ({ shoulder, elbow, wrist }: Chain<Point2>, aspect: number): number | null => {
  const upperArm = Math.hypot((shoulder.x - elbow.x) * aspect, shoulder.y - elbow.y);
  if (upperArm === 0) return null;
  // Screen y grows downward, so "above the elbow" is the negated difference.
  return (elbow.y - wrist.y) / upperArm;
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
  chain: Chain<Point2> | null,
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
  if (!chain) return;

  const points = [chain.shoulder, chain.elbow, chain.wrist].map((joint) => ({
    x: joint.x * width,
    y: joint.y * height,
  }));
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
