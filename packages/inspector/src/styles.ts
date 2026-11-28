/**
 * The inspector's stylesheet, as a string so a host can put it inside a shadow root (the
 * extension) or a `<style>` in the document (the web app). Every rule is scoped under
 * `.uic-inspector`, the class `Inspector` renders, so nothing leaks into the page either way.
 */
export const inspectorCss = `
.uic-inspector {
  --uic-accent: oklch(0.684 0.207 37);
  --uic-accent-hover: oklch(0.72 0.19 37);
  --uic-accent-soft: oklch(0.684 0.207 37 / 0.45);
  --uic-ink: oklch(0.63 0.26 29.23);
  --uic-scrim: rgb(0 0 0 / 0.42);
  --uic-scrim-light: rgb(0 0 0 / 0.18);
  --uic-bg: #ffffff;
  --uic-bg-2: #f4f4f5;
  --uic-fg: #18181b;
  --uic-fg-2: #71717a;
  --uic-border: rgb(0 0 0 / 0.08);
  --uic-danger: #dc2626;
  --uic-shadow: 0 0 0 1px rgb(0 0 0 / 0.06), 0 12px 32px -8px rgb(0 0 0 / 0.28), 0 4px 12px -4px rgb(0 0 0 / 0.12);
  --uic-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --uic-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --uic-focus: #0d99ff;
  --uic-bar-bg: #ffffff;
  --uic-bar-fg: #171717;
  --uic-bar-fg-2: #6d6d6d;
  --uic-bar-fg-hover: #333333;
  --uic-bar-hover: rgb(10 10 10 / 0.05);
  --uic-bar-pressed: rgb(10 10 10 / 0.1);
  --uic-bar-line: #e6e6e6;
  --uic-bar-shadow: 0 0 0.4px rgb(0 0 0 / 0.22), 0 0 0 0.5px rgb(0 0 0 / 0.06), 0 1px 3px rgb(0 0 0 / 0.1), 0 3px 8px rgb(0 0 0 / 0.1), 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: none;
  color: var(--uic-fg);
  font: 400 14px/20px Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
  color-scheme: light dark;
}

@media (prefers-color-scheme: dark) {
  .uic-inspector {
    --uic-bg: #1c1c1f;
    --uic-bg-2: #2a2a2e;
    --uic-fg: #f4f4f5;
    --uic-fg-2: #a1a1aa;
    --uic-border: rgb(255 255 255 / 0.08);
    --uic-danger: #f87171;
    --uic-shadow: 0 0 0 1px rgb(255 255 255 / 0.08), 0 16px 40px -8px rgb(0 0 0 / 0.6);
    --uic-bar-bg: #1c1c1f;
    --uic-bar-fg: #f5f5f5;
    --uic-bar-fg-2: #a1a1a1;
    --uic-bar-fg-hover: #e5e5e5;
    --uic-bar-hover: rgb(255 255 255 / 0.06);
    --uic-bar-pressed: rgb(255 255 255 / 0.12);
    --uic-bar-line: rgb(255 255 255 / 0.1);
    --uic-bar-shadow: 0 0 0 0.5px rgb(255 255 255 / 0.12), 0 3px 8px rgb(0 0 0 / 0.3), 0 10px 15px -3px rgb(0 0 0 / 0.4);
  }
}

.uic-inspector *, .uic-inspector *::before, .uic-inspector *::after { box-sizing: border-box; }
.uic-inspector [hidden] { display: none !important; }
.uic-inspector button { font: inherit; color: inherit; cursor: pointer; border: 0; background: none; padding: 0; margin: 0; }
.uic-inspector[data-capturing] .uic-chrome { visibility: hidden !important; }

.uic-bar { --uic-bar-ease: cubic-bezier(0.23, 1, 0.32, 1); position: absolute; left: 50%; bottom: 20px; translate: -50% 0; display: flex; align-items: stretch; height: 40px; padding: 4px; border-radius: 12px; background: var(--uic-bar-bg); box-shadow: var(--uic-bar-shadow); pointer-events: auto; user-select: none; animation: uic-bar-in 200ms var(--uic-bar-ease) 40ms both; }
.uic-group { display: flex; min-width: 0; margin: 0; padding: 0 4px; border: 0; align-items: center; gap: 4px; }
.uic-divider { flex: none; width: 1px; margin: -4px 0; background: var(--uic-bar-line); }

.uic-tool, .uic-switch-option { position: relative; display: grid; place-items: center; flex: none; color: var(--uic-bar-fg-2); }
.uic-tool { width: 32px; height: 32px; border-radius: 8px; }
.uic-tool svg { width: 18px; height: 18px; stroke-width: 1.5; }
.uic-tool:hover { background: var(--uic-bar-hover); color: var(--uic-bar-fg-hover); }
.uic-tool[aria-pressed="true"] { background: var(--uic-bar-pressed); color: var(--uic-bar-fg); }
.uic-tool:focus-visible, .uic-switch-option:focus-visible { outline: 2px solid var(--uic-focus); outline-offset: -2px; }
.uic-tool:disabled { opacity: 0.4; pointer-events: none; }

.uic-switch { position: relative; display: flex; align-items: center; flex: none; gap: 2px; margin: 0 4px 0 0; padding: 2px; border: 0; border-radius: 8px; }
.uic-switch-pill { position: absolute; top: 2px; left: 2px; width: 28px; height: 28px; border-radius: 6px; background: var(--uic-bar-pressed); transition: translate 200ms ease; }
.uic-switch-option { z-index: 1; width: 28px; height: 28px; border-radius: 6px; }
.uic-switch-option svg { width: 18px; height: 18px; stroke-width: 1.5; }
.uic-switch-option:hover { color: var(--uic-bar-fg-hover); }
.uic-switch-option[aria-pressed="true"] { color: var(--uic-bar-fg); }

.uic-stage { flex: none; min-width: 0; }
.uic-stage[data-moving] { overflow: hidden; }
.uic-stage:not([data-moving]) .uic-panel:not([data-open]) { visibility: hidden; }
.uic-stage[data-ready] { transition: width 200ms ease; }
.uic-track { display: flex; height: 100%; }
.uic-stage[data-ready] .uic-track { transition: translate 200ms ease; }
.uic-panel { display: flex; flex: none; }
.uic-panel > .uic-group { width: max-content; }

.uic-tip { position: absolute; bottom: calc(100% + 12px); left: 50%; translate: -50% 0; display: flex; align-items: center; gap: 8px; padding: 4px 4px 4px 10px; border-radius: 8px; background: #000; color: #fff; font-size: 12px; line-height: 20px; font-weight: 400; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 150ms cubic-bezier(0.4, 0, 0.2, 1); }
.uic-tip kbd { display: grid; place-items: center; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 5px; background: rgb(255 255 255 / 0.18); color: rgb(255 255 255 / 0.8); font: inherit; font-size: 11px; }
.uic-tool:hover .uic-tip, .uic-tool:focus-visible .uic-tip, .uic-switch-option:hover .uic-tip, .uic-switch-option:focus-visible .uic-tip { opacity: 1; }


.uic-surface { position: absolute; inset: 0; overflow: hidden; pointer-events: none; user-select: none; touch-action: none; }
.uic-surface[data-active] { pointer-events: auto; cursor: crosshair; }
.uic-surface[data-dim] { background: var(--uic-scrim); transition: background 200ms ease-out; }
.uic-surface[data-dim][data-hovering] { background: transparent; }

.uic-highlight, .uic-box { position: absolute; box-shadow: 0 0 0 100vmax var(--uic-scrim); }
.uic-surface:not([data-active]) .uic-box { box-shadow: 0 0 0 100vmax var(--uic-scrim-light); }
.uic-highlight { pointer-events: none; outline: 2px solid var(--uic-accent); outline-offset: -1px; border-radius: 2px; transition: left 250ms var(--uic-ease), top 250ms var(--uic-ease), width 250ms var(--uic-ease), height 250ms var(--uic-ease); }
.uic-box { outline: 1px solid var(--uic-accent); }
.uic-surface[data-active] .uic-box { cursor: move; }
.uic-surface[data-active] .uic-box::before, .uic-surface[data-active] .uic-box::after { content: ""; position: absolute; pointer-events: none; border: 0 solid var(--uic-accent-soft); }
.uic-box::before { inset: 0 33.333%; border-inline-width: 1px; }
.uic-box::after { inset: 33.333% 0; border-block-width: 1px; }
.uic-box[data-drawing] { cursor: crosshair; }
.uic-box[data-drawing]::before, .uic-box[data-drawing]::after { display: none; }
.uic-box[data-whole] { box-shadow: none; outline-width: 3px; outline-offset: -3px; }

.uic-label { position: absolute; bottom: calc(100% + 6px); left: -1px; padding: 2px 8px; border-radius: 6px; background: rgb(0 0 0 / 0.72); color: #fff; font: 500 11px/16px ui-monospace, SFMono-Regular, monospace; font-variant-numeric: tabular-nums; white-space: nowrap; pointer-events: none; }
.uic-highlight .uic-label { background: var(--uic-accent); }
.uic-box[data-whole] .uic-label { bottom: auto; top: 10px; left: 10px; }

.uic-handle { position: absolute; z-index: 1; width: 10px; height: 10px; margin: -5px 0 0 -5px; border-radius: 999px; background: #fff; border: 1px solid var(--uic-accent); animation: uic-pop 300ms var(--uic-spring) both; }
.uic-handle[data-handle="nw"] { top: 0; left: 0; cursor: nwse-resize; }
.uic-handle[data-handle="n"] { top: 0; left: 50%; cursor: ns-resize; }
.uic-handle[data-handle="ne"] { top: 0; left: 100%; cursor: nesw-resize; }
.uic-handle[data-handle="e"] { top: 50%; left: 100%; cursor: ew-resize; }
.uic-handle[data-handle="se"] { top: 100%; left: 100%; cursor: nwse-resize; }
.uic-handle[data-handle="s"] { top: 100%; left: 50%; cursor: ns-resize; }
.uic-handle[data-handle="sw"] { top: 100%; left: 0; cursor: nesw-resize; }
.uic-handle[data-handle="w"] { top: 50%; left: 0; cursor: ew-resize; }

.uic-hint { position: absolute; top: 16px; left: 50%; translate: -50% 0; padding: 8px 14px; border-radius: 999px; background: var(--uic-bg); color: var(--uic-fg); font-size: 13px; font-weight: 500; white-space: nowrap; box-shadow: var(--uic-shadow); pointer-events: none; animation: uic-drop 300ms var(--uic-ease) both; }
.uic-hint kbd { font: inherit; color: var(--uic-fg-2); }

.uic-marks { position: absolute; inset: 0; pointer-events: none; }
.uic-marks[data-tool] { pointer-events: auto; cursor: crosshair; }
.uic-marks[data-tool="select"] { cursor: default; }
.uic-marks[data-tool="text"] { cursor: text; }
.uic-marks svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.uic-stroke { fill: none; stroke: var(--uic-ink); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.uic-head { fill: var(--uic-ink); }
.uic-selected { fill: none; stroke: var(--uic-accent); stroke-width: 1; stroke-dasharray: 4 3; }

.uic-note { position: absolute; max-width: 280px; padding: 3px 8px; border-radius: 7px; background: var(--uic-ink); color: #fff; font: 600 13px/18px Inter, ui-sans-serif, system-ui, sans-serif; white-space: pre-wrap; overflow-wrap: anywhere; box-shadow: 0 1px 2px rgb(0 0 0 / 0.2); }
.uic-marks[data-tool="select"] .uic-note { cursor: move; }
.uic-note[data-selected] { outline: 1px dashed var(--uic-accent); outline-offset: 3px; }
.uic-note-input { position: absolute; min-width: 120px; padding: 3px 8px; border: 0; border-radius: 7px; background: var(--uic-ink); color: #fff; font: 600 13px/18px Inter, ui-sans-serif, system-ui, sans-serif; outline: 2px solid var(--uic-accent-soft); pointer-events: auto; field-sizing: content; }
.uic-note-input::placeholder { color: rgb(255 255 255 / 0.7); }

@keyframes uic-pop { from { scale: 0; } }
@keyframes uic-bar-in { from { opacity: 0; translate: -50% 8px; scale: 0.96; } }
@keyframes uic-drop { from { opacity: 0; filter: blur(3px); translate: -50% -12px; } }

@media (prefers-reduced-motion: reduce) {
  .uic-inspector *, .uic-inspector *::before, .uic-inspector *::after { animation-duration: 1ms !important; transition-duration: 1ms !important; }
}
`;
