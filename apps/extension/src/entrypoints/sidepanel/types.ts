import type { PickMode, Selection } from "@/lib/messages";

export interface Media {
  file: File;
  id: string;
  kind: "image" | "video";
  note: string;
  previewUrl: string;
}

export type VideoStatus =
  | { state: "none" }
  | { state: "working"; text: string }
  | { state: "attached"; text: string }
  | { state: "linked"; text: string };

export interface Capture {
  media: Media[];
  selection: Selection;
  video: VideoStatus;
}

export interface Target {
  mode: PickMode;
  tabId: number;
  windowId: number;
}

export interface Filed {
  number?: number;
  url: string;
}

export const toMedia = (file: File, note: string) =>
  ({
    file,
    id: crypto.randomUUID(),
    kind: file.type.startsWith("video/") ? "video" : "image",
    note,
    previewUrl: URL.createObjectURL(file),
  }) satisfies Media;

export const FALLBACK_ERROR = "Something went wrong. Try again.";
