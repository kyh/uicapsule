/** Shared window-manager vocabulary. Kept dependency-free to avoid import cycles. */

export type WindowKind = "quicklook" | "photos" | "notes" | "finder" | "terminal";

export interface OpenWindow {
  readonly uid: number;
  readonly kind: WindowKind;
  readonly z: number;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /** Quick Look only — which desktop file is being previewed. */
  readonly fileId?: string;
  /** Finder only — which folder the window is showing. */
  readonly folderName?: string;
}

export const DEFAULT_WINDOW_SIZES = {
  finder: { h: 460, w: 760 },
  notes: { h: 520, w: 720 },
  photos: { h: 600, w: 880 },
  quicklook: { h: 560, w: 760 },
  terminal: { h: 400, w: 640 },
} satisfies Record<WindowKind, { readonly w: number; readonly h: number }>;

export interface WindowCtx {
  readonly isMobile: boolean;
  readonly openQuickLook: (fileId: string) => void;
  readonly openLightbox: (src: string) => void;
}
