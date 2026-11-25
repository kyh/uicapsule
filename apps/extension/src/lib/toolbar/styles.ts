export const TOOLBAR_CSS = `
:host {
  all: initial;
  --tabs-dur: 250ms;
  --tabs-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --dropdown-open-dur: 250ms;
  --dropdown-close-dur: 150ms;
  --dropdown-pre-scale: 0.97;
  --dropdown-closing-scale: 0.99;
  --dropdown-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --text-morph-dur: 180ms;
  --text-morph-resize-dur: 240ms;
  --text-morph-blur: 2px;
  --text-morph-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --text-morph-stagger: 35ms;
  --text-morph-rise: 3px;
  --icon-swap-dur: 250ms;
  --icon-swap-blur: 2px;
  --icon-swap-start-scale: 0.25;
  --press-scale: 0.99;
  --press-dur: 150ms;
  --ease-smooth-out: cubic-bezier(0.22, 1, 0.36, 1);
  --tt-in-dur: 150ms;
  --tt-out-dur: 50ms;
  --tt-delay: 80ms;
  --tt-move-dur: 160ms;
  --seg-fill: rgba(255, 255, 255, 0.08);
  --opt-hover-fill: rgba(255, 255, 255, 0.03);
  --btn-edge-top: rgba(255, 255, 255, 0.1);
  --btn-edge-bottom: rgba(255, 255, 255, 0.02);
  --btn-edge-top-cap: rgba(255, 255, 255, 0.22);
  --btn-edge-bottom-cap: rgba(255, 255, 255, 0.04);
  --accent: oklch(0.684 0.207 37);
  --accent-hover: oklch(0.72 0.19 37);
  --panel: #1d1d1d;
  --bar: #151515;
  --muted: rgba(255, 255, 255, 0.5);
  --panel-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 0 1px rgba(196, 196, 196, 0.08), 0 8px 24px rgba(0, 0, 0, 0.4);
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: none;
  color: #fff;
  font: 400 13px/20px -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}
* { box-sizing: border-box; }
button, input, textarea { font: inherit; letter-spacing: inherit; color: inherit; }
button { border: 0; background: none; padding: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; user-select: none; }
button:disabled { cursor: default; opacity: 0.45; }

.layer { position: fixed; inset: 0; pointer-events: none; }
.layer[data-picking="area"] { pointer-events: auto; cursor: crosshair; }
.layer[data-picking="element"] { pointer-events: auto; cursor: default; }
.box { position: fixed; display: none; pointer-events: none; border: 2px solid var(--accent); background: rgba(255, 90, 31, 0.12); border-radius: 6px; box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.3); }
.box[data-animate] { transition: left 120ms var(--ease-smooth-out), top 120ms var(--ease-smooth-out), width 120ms var(--ease-smooth-out), height 120ms var(--ease-smooth-out); }
.box-tag { position: absolute; left: -2px; bottom: calc(100% + 6px); padding: 2px 8px; border-radius: 999px; background: var(--accent); font: 500 11px/16px ui-monospace, SFMono-Regular, monospace; white-space: nowrap; }

.dock { position: fixed; left: 50%; bottom: 24px; translate: -50% 0; display: flex; flex-direction: column; align-items: center; gap: 12px; pointer-events: auto; }
.dock[data-hidden] { visibility: hidden; }
[hidden] { display: none !important; }
.wrap { display: flex; align-items: center; gap: 12px; animation: dock-in 300ms var(--ease-smooth-out); }
@keyframes dock-in { from { opacity: 0; translate: 0 12px; scale: 0.97; } }

.close { flex: none; width: 47px; height: 47px; border-radius: 50%; display: grid; place-items: center; background: var(--bar); box-shadow: 0 8px 32px -4px rgba(0, 0, 0, 0.4); --press-scale: 0.95; }
@media (hover: hover) { .close:hover { background: #1c1c1c; } }

.bar { position: relative; display: flex; align-items: center; gap: 8px; padding: 6px; border-radius: 26px; background: var(--bar); box-shadow: inset 0 0 0 0.5px rgba(255, 255, 255, 0.14), 0 8px 32px -4px rgba(0, 0, 0, 0.4); }
.bar button, .close, .card button { transition: transform var(--press-dur) var(--ease-smooth-out), background-color var(--press-dur) var(--ease-smooth-out), color var(--press-dur) var(--ease-smooth-out); }
:is(.bar, .card) button:not(:disabled):active, .close:active { transform: scale(var(--press-scale)); }
:is(.bar, .card, .wrap) button:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--bar), 0 0 0 4px #fff; }

.tt-group { position: relative; display: inline-flex; }
.modes { position: relative; display: flex; gap: 4px; }
.pill { position: absolute; top: 0; left: 0; width: 0; height: 40px; border-radius: 20px; background: var(--seg-fill); transition: transform var(--tabs-dur) var(--tabs-ease), width var(--tabs-dur) var(--tabs-ease); pointer-events: none; }
.mode { position: relative; z-index: 1; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; color: var(--muted); --press-scale: 0.95; transition: transform var(--press-dur) var(--ease-smooth-out), color var(--tabs-dur) var(--tabs-ease) !important; }
.mode[aria-selected="true"] { color: #fff; }
@media (hover: hover) {
  .mode:not([aria-selected="true"]):hover { color: rgba(255, 255, 255, 0.8); }
  .opt:hover { background: var(--opt-hover-fill); }
  .item:hover { background: rgba(255, 255, 255, 0.07); }
  .cap:not(:disabled):hover { background: var(--accent-hover); }
}
.sep { width: 2px; height: 16px; border-radius: 2px; background: rgba(255, 255, 255, 0.14); }

.tt { position: absolute; bottom: calc(100% + 14px); left: 0; display: inline-flex; justify-content: center; width: 0; overflow: hidden; translate: var(--tt-x, 0px) 0; scale: 0.98; transform-origin: 50% 100%; padding: 8px 12px; border-radius: 8px; background: #262626; color: #f2f2f2; font-size: 12px; line-height: 16px; white-space: nowrap; box-shadow: var(--panel-shadow); opacity: 0; pointer-events: none; transition: opacity var(--tt-out-dur) ease-out, scale var(--tt-out-dur) ease-out, translate var(--tt-move-dur) var(--ease-smooth-out), width var(--tt-move-dur) var(--ease-smooth-out); }
.tt[data-show="true"] { opacity: 1; scale: 1; transition: opacity var(--tt-in-dur) ease-out var(--tt-delay), scale var(--tt-in-dur) ease-out var(--tt-delay), translate var(--tt-move-dur) var(--ease-smooth-out), width var(--tt-move-dur) var(--ease-smooth-out); }

.opt-wrap { position: relative; }
.opt { position: relative; height: 40px; padding: 0 10px 0 14px; border-radius: 20px; font-weight: 500; display: inline-flex; align-items: center; gap: 6px; --press-scale: 0.97; }
.opt-chev { display: inline-flex; color: var(--muted); }
.opt[aria-expanded="true"] { background: var(--seg-fill); }

.menu { position: absolute; bottom: calc(100% + 12px); left: 50%; margin-left: -88px; width: 176px; padding: 6px; border-radius: 22px; background: var(--panel); box-shadow: var(--panel-shadow); transform-origin: bottom center; transform: scale(var(--dropdown-pre-scale)); opacity: 0; pointer-events: none; transition: transform var(--dropdown-open-dur) var(--dropdown-ease), opacity var(--dropdown-open-dur) var(--dropdown-ease); }
.menu.is-open { transform: scale(1); opacity: 1; pointer-events: auto; }
.menu.is-closing { transform: scale(var(--dropdown-closing-scale)); opacity: 0; transition-duration: var(--dropdown-close-dur); }
.item { width: 100%; height: 32px; padding: 0 8px 0 6px; border-radius: 16px; display: flex; align-items: center; gap: 8px; text-align: left; }
.item-ic { flex: none; display: inline-flex; color: var(--muted); }
.item-label { flex: 1; white-space: nowrap; }
.item-check { flex: none; opacity: 0; transition: opacity var(--press-dur) var(--ease-smooth-out); }
.item[aria-checked="true"] .item-check { opacity: 1; }
.menu-sep { height: 1px; margin: 4px 6px; background: rgba(255, 255, 255, 0.08); }

.cap { position: relative; height: 40px; padding: 0 12px 0 10px; border-radius: 20px; background: var(--accent); display: flex; align-items: center; gap: 6px; font-weight: 500; box-shadow: 0 0 18px rgba(255, 90, 31, 0.35); --press-scale: 0.97; }
.cap:disabled { opacity: 1; background: #2a2a2a; box-shadow: none; color: var(--muted); }
.close::after, .opt::after, .cap::after, .pill::after { content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 0.5px; background: linear-gradient(180deg, var(--btn-edge-top), var(--btn-edge-bottom)); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); pointer-events: none; }
.close { position: relative; }
.opt::after { opacity: 0; }
.opt[aria-expanded="true"]::after { opacity: 1; }
.cap::after { background: linear-gradient(180deg, var(--btn-edge-top-cap), var(--btn-edge-bottom-cap)); }

.swap { position: relative; display: inline-grid; flex: none; width: 20px; height: 20px; }
.swap > span { grid-area: 1 / 1; display: grid; place-items: center; opacity: 0; filter: blur(var(--icon-swap-blur)); transform: scale(var(--icon-swap-start-scale)); transition: opacity var(--icon-swap-dur) ease-in-out, filter var(--icon-swap-dur) ease-in-out, transform var(--icon-swap-dur) ease-in-out; }
.swap > span[data-on] { opacity: 1; filter: blur(0); transform: scale(1); }

.morph { white-space: nowrap; }
.morph-swap { display: inline-grid; vertical-align: bottom; justify-items: start; overflow-x: clip; transition: width var(--text-morph-resize-dur) var(--text-morph-ease); }
.morph-swap > span { grid-area: 1 / 1; white-space: pre; }
.ch { display: inline-block; white-space: pre; transition: opacity var(--text-morph-dur) var(--text-morph-ease) calc(var(--i, 0) * var(--text-morph-stagger)), filter var(--text-morph-dur) var(--text-morph-ease) calc(var(--i, 0) * var(--text-morph-stagger)), transform var(--text-morph-dur) var(--text-morph-ease) calc(var(--i, 0) * var(--text-morph-stagger)); }
.morph-new .ch { opacity: 0; filter: blur(var(--text-morph-blur)); transform: translateY(var(--text-morph-rise)); }
.morph-swap.is-morphing .morph-old .ch { opacity: 0; filter: blur(var(--text-morph-blur)); transform: translateY(calc(var(--text-morph-rise) * -1)); }
.morph-swap.is-morphing .morph-new .ch { opacity: 1; filter: blur(0); transform: none; }

.card { width: 380px; max-height: calc(100vh - 120px); overflow: auto; padding: 12px; border-radius: 22px; background: var(--panel); box-shadow: var(--panel-shadow); display: flex; flex-direction: column; gap: 10px; transform-origin: bottom center; transform: scale(var(--dropdown-pre-scale)) translateY(8px); opacity: 0; pointer-events: none; transition: transform var(--dropdown-open-dur) var(--dropdown-ease), opacity var(--dropdown-open-dur) var(--dropdown-ease); }
.card.is-open { transform: none; opacity: 1; pointer-events: auto; }
.card[hidden] { display: none; }
.shot { display: block; width: 100%; max-height: 180px; object-fit: contain; border-radius: 14px; background: #111; box-shadow: inset 0 0 0 0.5px rgba(255, 255, 255, 0.1); }
.meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--muted); font-size: 12px; line-height: 16px; }
.meta-where { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chip { display: inline-flex; align-items: center; gap: 6px; flex: none; padding: 2px 8px 2px 6px; border-radius: 999px; background: var(--seg-fill); color: #fff; }
.chip[data-state="working"] .chip-dot { animation: pulse 900ms ease-in-out infinite alternate; }
.chip-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
.chip[data-state="linked"] .chip-dot { background: rgba(255, 255, 255, 0.4); }
@keyframes pulse { to { opacity: 0.25; } }
.field { display: flex; flex-direction: column; gap: 4px; }
.field input, .field textarea { width: 100%; padding: 8px 12px; border: 0; border-radius: 12px; background: rgba(255, 255, 255, 0.06); box-shadow: inset 0 0 0 0.5px rgba(255, 255, 255, 0.1); outline: none; resize: none; transition: box-shadow var(--press-dur) var(--ease-smooth-out), background-color var(--press-dur) var(--ease-smooth-out); }
.field textarea { min-height: 76px; }
.field input::placeholder, .field textarea::placeholder { color: rgba(255, 255, 255, 0.35); }
.field input:focus, .field textarea:focus { background: rgba(255, 255, 255, 0.08); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35); }
.field[data-invalid] input, .field[data-invalid] textarea { box-shadow: inset 0 0 0 1px rgba(255, 99, 99, 0.7); }
.error { color: #ff8a8a; font-size: 12px; line-height: 16px; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.done { display: flex; flex-direction: column; gap: 4px; padding: 4px 2px; }
.done-title { font-weight: 500; font-size: 14px; }
.done a { color: var(--accent-hover); text-decoration: none; }
.done p { margin: 0; color: var(--muted); }

.toast { max-width: 380px; padding: 8px 14px; border-radius: 14px; background: #262626; color: #f2f2f2; font-size: 12px; line-height: 16px; box-shadow: var(--panel-shadow); opacity: 0; translate: 0 6px; transition: opacity 150ms ease-out, translate 200ms var(--ease-smooth-out); pointer-events: none; }
.toast[data-show] { opacity: 1; translate: 0 0; }

@media (prefers-reduced-motion: reduce) {
  .pill, .mode, .menu, .morph-swap, .ch, .swap > span, .bar button, .close, .tt, .card, .toast, .box[data-animate] { transition: none !important; }
  .wrap { animation: none; }
  :is(.bar, .card) button:active, .close:active { transform: none; }
}
`;
