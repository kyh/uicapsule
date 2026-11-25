export const OVERLAY_CSS = `
:host {
  all: initial;
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: none;
  color-scheme: light dark;
  font: 400 14px/20px Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
  --accent: oklch(0.684 0.207 37);
  --accent-hover: oklch(0.72 0.19 37);
  --accent-soft: oklch(0.684 0.207 37 / 0.45);
  --scrim: rgb(0 0 0 / 0.42);
  --bg: #ffffff;
  --bg-2: #f4f4f5;
  --fg: #18181b;
  --fg-2: #71717a;
  --border: rgb(0 0 0 / 0.08);
  --danger: #dc2626;
  --shadow: 0 0 0 1px rgb(0 0 0 / 0.06), 0 12px 32px -8px rgb(0 0 0 / 0.28), 0 4px 12px -4px rgb(0 0 0 / 0.12);
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

@media (prefers-color-scheme: dark) {
  :host {
    --bg: #1c1c1f;
    --bg-2: #2a2a2e;
    --fg: #f4f4f5;
    --fg-2: #a1a1aa;
    --border: rgb(255 255 255 / 0.08);
    --danger: #f87171;
    --shadow: 0 0 0 1px rgb(255 255 255 / 0.08), 0 16px 40px -8px rgb(0 0 0 / 0.6);
  }
}

* { box-sizing: border-box; }
[hidden] { display: none !important; }
:host([data-hidden]) { visibility: hidden; }

button { font: inherit; color: inherit; cursor: pointer; border: 0; background: none; padding: 0; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 32px; padding: 0 14px; border-radius: 999px; background: var(--bg-2); font-weight: 500; font-size: 13px; transition: background 150ms ease-out, scale 150ms var(--ease), opacity 150ms; }
.btn:hover { background: color-mix(in oklab, var(--bg-2), var(--fg) 6%); }
.btn:active { scale: 0.97; }
.btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.btn[data-primary] { background: var(--accent); color: #fff; }
.btn[data-primary]:hover { background: var(--accent-hover); }
.btn:disabled { opacity: 0.55; pointer-events: none; }

.surface { position: absolute; inset: 0; overflow: hidden; pointer-events: auto; cursor: crosshair; user-select: none; touch-action: none; }
.surface[data-picking] { background: var(--scrim); transition: background 200ms ease-out; }
.surface[data-picking][data-hovering] { background: transparent; }

.highlight, .box { position: absolute; box-shadow: 0 0 0 100vmax var(--scrim); }
.highlight { pointer-events: none; outline: 2px solid var(--accent); outline-offset: -1px; border-radius: 2px; transition: left 250ms var(--ease), top 250ms var(--ease), width 250ms var(--ease), height 250ms var(--ease); }
.box { cursor: move; outline: 1px solid var(--accent); }
.box::before, .box::after { content: ""; position: absolute; pointer-events: none; border: 0 solid var(--accent-soft); }
.box::before { inset: 0 33.333%; border-inline-width: 1px; }
.box::after { inset: 33.333% 0; border-block-width: 1px; }
.box[data-drawing] { cursor: crosshair; }
.box[data-drawing]::before, .box[data-drawing]::after { display: none; }

.size, .tag { position: absolute; bottom: calc(100% + 6px); left: -1px; padding: 2px 8px; border-radius: 6px; background: rgb(0 0 0 / 0.72); color: #fff; font: 500 11px/16px ui-monospace, SFMono-Regular, monospace; font-variant-numeric: tabular-nums; white-space: nowrap; pointer-events: none; }
.highlight .tag { background: var(--accent); }

.handle { position: absolute; z-index: 1; width: 10px; height: 10px; margin: -5px 0 0 -5px; border-radius: 999px; background: #fff; border: 1px solid var(--accent); animation: pop 300ms var(--spring) both; }
.handle[data-handle="nw"] { top: 0; left: 0; cursor: nwse-resize; }
.handle[data-handle="n"] { top: 0; left: 50%; cursor: ns-resize; }
.handle[data-handle="ne"] { top: 0; left: 100%; cursor: nesw-resize; }
.handle[data-handle="e"] { top: 50%; left: 100%; cursor: ew-resize; }
.handle[data-handle="se"] { top: 100%; left: 100%; cursor: nwse-resize; }
.handle[data-handle="s"] { top: 100%; left: 50%; cursor: ns-resize; }
.handle[data-handle="sw"] { top: 100%; left: 0; cursor: nesw-resize; }
.handle[data-handle="w"] { top: 50%; left: 0; cursor: ew-resize; }
@keyframes pop { from { scale: 0; } }

.actions { position: absolute; display: flex; gap: 6px; padding: 6px; border-radius: 999px; background: var(--bg); color: var(--fg); box-shadow: var(--shadow); cursor: default; animation: rise 250ms var(--ease) both; }

.hint { position: absolute; top: 16px; left: 50%; translate: -50% 0; padding: 8px 14px; border-radius: 999px; background: var(--bg); color: var(--fg); font-size: 13px; font-weight: 500; white-space: nowrap; box-shadow: var(--shadow); pointer-events: none; animation: drop 300ms var(--ease) both; }
.hint kbd { font: inherit; color: var(--fg-2); }
@keyframes drop { from { opacity: 0; filter: blur(3px); translate: -50% -12px; } }
@keyframes rise { from { opacity: 0; filter: blur(2px); transform: translateY(4px); } }

.backdrop { position: absolute; inset: 0; background: var(--scrim); pointer-events: auto; animation: fade 200ms ease-out both; }
@keyframes fade { from { opacity: 0; } }
.dialog { position: absolute; top: 50%; left: 50%; translate: -50% -50%; display: flex; flex-direction: column; gap: 12px; width: min(440px, calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto; padding: 16px; border-radius: 16px; background: var(--bg); color: var(--fg); box-shadow: var(--shadow); pointer-events: auto; animation: dialog-in 250ms var(--ease) both; }
@keyframes dialog-in { from { opacity: 0; scale: 0.96; filter: blur(2px); } }
.dialog-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.dialog-title { margin: 0; font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
.icon-btn { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 999px; color: var(--fg-2); transition: background 150ms, color 150ms; }
.icon-btn:hover { background: var(--bg-2); color: var(--fg); }
.icon-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }

.preview { position: relative; display: flex; align-items: center; justify-content: center; height: 200px; padding: 12px; overflow: hidden; border-radius: 12px; background: var(--bg-2); }
.shot { display: block; max-width: 100%; max-height: 176px; width: auto; height: auto; border-radius: 4px; }
.badge { position: absolute; bottom: 8px; left: 8px; padding: 2px 8px; border-radius: 6px; background: rgb(0 0 0 / 0.65); color: #fff; font: 500 11px/16px ui-monospace, SFMono-Regular, monospace; font-variant-numeric: tabular-nums; }
.chip { position: absolute; bottom: 8px; right: 8px; display: inline-flex; align-items: center; gap: 6px; padding: 2px 8px 2px 7px; border-radius: 999px; background: rgb(0 0 0 / 0.65); color: #fff; font-size: 12px; line-height: 18px; }
.chip-dot { width: 6px; height: 6px; border-radius: 999px; background: #a1a1aa; }
.chip[data-state="attached"] .chip-dot { background: var(--accent); }
.chip[data-state="working"] .chip-dot { background: var(--accent); animation: pulse 1s ease-in-out infinite; }
@keyframes pulse { 50% { opacity: 0.3; } }
.where { margin-top: -4px; overflow: hidden; color: var(--fg-2); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }

.field { display: flex; flex-direction: column; gap: 4px; }
.field input, .field textarea { width: 100%; padding: 9px 12px; border: 1px solid transparent; border-radius: 10px; background: var(--bg-2); color: var(--fg); font: inherit; outline: none; transition: border-color 150ms, box-shadow 150ms; }
.field textarea { min-height: 84px; resize: vertical; }
.field input::placeholder, .field textarea::placeholder { color: var(--fg-2); }
.field input:focus, .field textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.field[data-invalid] input, .field[data-invalid] textarea { border-color: var(--danger); }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.error { margin: 0; color: var(--danger); font-size: 12px; line-height: 16px; }

.dialog-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
.leading { display: flex; align-items: center; gap: 8px; min-width: 0; color: var(--fg-2); font-size: 12px; }
.leading span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.leading kbd { flex: none; padding: 0 5px; border: 1px solid var(--border); border-radius: 5px; font: inherit; font-size: 11px; }
.buttons { display: flex; gap: 6px; flex: none; }

.toast { position: absolute; right: 24px; bottom: 24px; display: flex; align-items: center; gap: 12px; max-width: min(360px, calc(100vw - 48px)); padding: 12px 12px 12px 14px; border-radius: 14px; background: var(--bg); color: var(--fg); box-shadow: var(--shadow); pointer-events: auto; animation: toast-in 300ms var(--ease) both; }
.toast[data-leaving] { animation: toast-out 200ms ease-in both; }
@keyframes toast-in { from { opacity: 0; translate: 0 12px; scale: 0.97; } }
@keyframes toast-out { to { opacity: 0; translate: 0 6px; scale: 0.98; } }
.toast-icon { display: grid; place-items: center; flex: none; width: 22px; height: 22px; border-radius: 999px; background: var(--accent); color: #fff; }
.toast-icon svg { width: 14px; height: 14px; }
.toast[data-tone="error"] .toast-icon { background: var(--danger); }
.toast-body { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.toast-title { font-weight: 500; }
.toast-text { color: var(--fg-2); font-size: 12px; line-height: 16px; }
.toast a { flex: none; color: var(--accent); font-weight: 500; font-size: 13px; text-decoration: none; }
.toast a:hover { text-decoration: underline; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 1ms !important; transition-duration: 1ms !important; }
}
`;
