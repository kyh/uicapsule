/** The request dialog and toast, on the inspector's tokens; the shadow host itself resets the page's styles. */
export const REQUEST_CSS = `
:host { all: initial; }

.uic-inspector .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 32px; padding: 0 14px; border-radius: 999px; background: var(--uic-bg-2); font-weight: 500; font-size: 13px; transition: background 150ms ease-out, scale 150ms var(--uic-ease), opacity 150ms; }
.uic-inspector .btn:hover { background: color-mix(in oklab, var(--uic-bg-2), var(--uic-fg) 6%); }
.uic-inspector .btn:active { scale: 0.97; }
.uic-inspector .btn:focus-visible { outline: 2px solid var(--uic-accent); outline-offset: 2px; }
.uic-inspector .btn[data-primary] { background: var(--uic-accent); color: #fff; }
.uic-inspector .btn[data-primary]:hover { background: var(--uic-accent-hover); }
.uic-inspector .btn:disabled { opacity: 0.55; pointer-events: none; }

.uic-inspector .backdrop { position: absolute; inset: 0; background: var(--uic-scrim); pointer-events: auto; animation: uic-fade 200ms ease-out both; }
@keyframes uic-fade { from { opacity: 0; } }
.uic-inspector .dialog { position: absolute; margin: 0; border: 0; inset: auto; top: 50%; left: 50%; translate: -50% -50%; display: flex; flex-direction: column; gap: 12px; width: min(440px, calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto; padding: 16px; border-radius: 16px; background: var(--uic-bg); color: var(--uic-fg); box-shadow: var(--uic-shadow); pointer-events: auto; animation: uic-dialog-in 250ms var(--uic-ease) both; }
@keyframes uic-dialog-in { from { opacity: 0; scale: 0.96; filter: blur(2px); } }
.uic-inspector .dialog-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.uic-inspector .dialog-title { margin: 0; font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
.uic-inspector .icon-btn { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 999px; color: var(--uic-fg-2); transition: background 150ms, color 150ms; }
.uic-inspector .icon-btn:hover { background: var(--uic-bg-2); color: var(--uic-fg); }
.uic-inspector .icon-btn:focus-visible { outline: 2px solid var(--uic-accent); outline-offset: 1px; }

.uic-inspector .preview { position: relative; display: flex; align-items: center; justify-content: center; height: 200px; padding: 12px; overflow: hidden; border-radius: 12px; background: var(--uic-bg-2); }
.uic-inspector .shot { display: block; max-width: 100%; max-height: 176px; width: auto; height: auto; border-radius: 4px; }
.uic-inspector .badge { position: absolute; bottom: 8px; left: 8px; padding: 2px 8px; border-radius: 6px; background: rgb(0 0 0 / 0.65); color: #fff; font: 500 11px/16px ui-monospace, SFMono-Regular, monospace; font-variant-numeric: tabular-nums; }
.uic-inspector .chip { position: absolute; bottom: 8px; right: 8px; display: inline-flex; align-items: center; gap: 6px; padding: 2px 8px 2px 7px; border-radius: 999px; background: rgb(0 0 0 / 0.65); color: #fff; font-size: 12px; line-height: 18px; }
.uic-inspector .chip-dot { width: 6px; height: 6px; border-radius: 999px; background: #a1a1aa; }
.uic-inspector .chip[data-state="attached"] .chip-dot { background: var(--uic-accent); }
.uic-inspector .chip[data-state="working"] .chip-dot { background: var(--uic-accent); animation: uic-pulse 1s ease-in-out infinite; }
@keyframes uic-pulse { 50% { opacity: 0.3; } }
.uic-inspector .where { margin-top: -4px; overflow: hidden; color: var(--uic-fg-2); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }

.uic-inspector .field { display: flex; flex-direction: column; gap: 4px; }
.uic-inspector .field input, .uic-inspector .field textarea { width: 100%; padding: 9px 12px; border: 1px solid transparent; border-radius: 10px; background: var(--uic-bg-2); color: var(--uic-fg); font: inherit; outline: none; transition: border-color 150ms, box-shadow 150ms; }
.uic-inspector .field textarea { min-height: 84px; resize: vertical; }
.uic-inspector .field input::placeholder, .uic-inspector .field textarea::placeholder { color: var(--uic-fg-2); }
.uic-inspector .field input:focus, .uic-inspector .field textarea:focus { border-color: var(--uic-accent); box-shadow: 0 0 0 3px var(--uic-accent-soft); }
.uic-inspector .field[data-invalid] input, .uic-inspector .field[data-invalid] textarea { border-color: var(--uic-danger); }
.uic-inspector .row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.uic-inspector .error { margin: 0; color: var(--uic-danger); font-size: 12px; line-height: 16px; }

.uic-inspector .dialog-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 12px; border-top: 1px solid var(--uic-border); }
.uic-inspector .leading { display: flex; align-items: center; gap: 8px; min-width: 0; color: var(--uic-fg-2); font-size: 12px; }
.uic-inspector .leading span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.uic-inspector .leading kbd { flex: none; padding: 0 5px; border: 1px solid var(--uic-border); border-radius: 5px; font: inherit; font-size: 11px; }
.uic-inspector .buttons { display: flex; gap: 6px; flex: none; }

.uic-inspector .toast { position: absolute; right: 24px; bottom: 24px; display: flex; align-items: center; gap: 12px; max-width: min(360px, calc(100vw - 48px)); padding: 12px 12px 12px 14px; border-radius: 14px; background: var(--uic-bg); color: var(--uic-fg); box-shadow: var(--uic-shadow); pointer-events: auto; animation: uic-toast-in 300ms var(--uic-ease) both; }
.uic-inspector .toast[data-leaving] { animation: uic-toast-out 200ms ease-in both; }
@keyframes uic-toast-in { from { opacity: 0; translate: 0 12px; scale: 0.97; } }
@keyframes uic-toast-out { to { opacity: 0; translate: 0 6px; scale: 0.98; } }
.uic-inspector .toast-icon { display: grid; place-items: center; flex: none; width: 22px; height: 22px; border-radius: 999px; background: var(--uic-accent); color: #fff; }
.uic-inspector .toast-icon svg { width: 14px; height: 14px; }
.uic-inspector .toast[data-tone="error"] .toast-icon { background: var(--uic-danger); }
.uic-inspector .toast-body { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.uic-inspector .toast-title { font-weight: 500; }
.uic-inspector .toast-text { color: var(--uic-fg-2); font-size: 12px; line-height: 16px; }
.uic-inspector .toast a { flex: none; color: var(--uic-accent); font-weight: 500; font-size: 13px; text-decoration: none; }
.uic-inspector .toast a:hover { text-decoration: underline; }
`;
