import { ATTACHMENT_MAX_BYTES } from "@repo/contract/request/attachment-schema";

import { encodeBlob } from "./encoding";
import type { FileResult } from "./messages";

const RECORD_MS = 6000;
const VIDEO_BITS_PER_SECOND = 2_500_000;
const MIME_TYPES = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];

const stopAfter = async (recorder: MediaRecorder, video: HTMLVideoElement, ms: number) => {
  // oxlint-disable-next-line promise/avoid-new -- MediaRecorder signals its end with an event, not a promise
  await new Promise<void>((resolve) => {
    const stop = () => {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    };

    const timer = setTimeout(stop, ms);
    video.addEventListener("ended", stop, { once: true });
    recorder.addEventListener(
      "stop",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
};

/** Records a few seconds of what the video is showing, then puts it back as it was. */
export const recordVideo = async (video: HTMLVideoElement) => {
  const mimeType = MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));

  if (!video.captureStream || mimeType === undefined || mimeType === "") {
    return { ok: false, reason: "This browser can't record video." } satisfies FileResult;
  }

  let stream: MediaStream;

  try {
    stream = video.captureStream();
  } catch {
    return {
      ok: false,
      reason: "The site doesn't allow recording this video.",
    } satisfies FileResult;
  }

  const { muted, paused } = video;
  const chunks: Blob[] = [];

  const recorder = new MediaRecorder(new MediaStream(stream.getVideoTracks()), {
    mimeType,
    videoBitsPerSecond: VIDEO_BITS_PER_SECOND,
  });

  recorder.addEventListener("dataavailable", (event) => {
    chunks.push(event.data);
  });

  try {
    if (paused) {
      video.muted = true;
      await video.play();
    }

    recorder.start(500);
    await stopAfter(recorder, video, RECORD_MS);
  } catch {
    return { ok: false, reason: "The video wouldn't play for recording." } satisfies FileResult;
  } finally {
    if (paused) {
      video.pause();
      video.muted = muted;
    }
  }

  const blob = new Blob(chunks, { type: mimeType.split(";")[0] });

  if (blob.size === 0) {
    return { ok: false, reason: "The recording came out empty." } satisfies FileResult;
  }

  if (blob.size > ATTACHMENT_MAX_BYTES) {
    return { ok: false, reason: "The recording is too large to attach." } satisfies FileResult;
  }

  return { file: await encodeBlob(blob, "recording.webm"), ok: true } satisfies FileResult;
};
