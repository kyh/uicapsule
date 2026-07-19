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

export const DEFAULT_WINDOW_SIZES: Record<WindowKind, { readonly w: number; readonly h: number }> =
  {
    quicklook: { w: 760, h: 560 },
    photos: { w: 880, h: 600 },
    notes: { w: 720, h: 520 },
    finder: { w: 760, h: 460 },
    terminal: { w: 640, h: 400 },
  };

export interface WindowCtx {
  readonly isMobile: boolean;
  readonly openQuickLook: (fileId: string) => void;
  readonly openLightbox: (src: string) => void;
}
