import { h, icons } from "./dom";

const TOAST_MS = 6000;
const LEAVE_MS = 200;

/** Shows one toast in `root` and resolves once it has left. */
export const showToast = async (
  root: ShadowRoot,
  toast: { link?: { href: string; label: string }; text?: string; title: string; tone?: "error" },
) =>
  // oxlint-disable-next-line promise/avoid-new -- resolves on the toast's own timers and close button
  await new Promise<void>((resolve) => {
    const close = h("button", { "aria-label": "Dismiss", class: "icon-btn", type: "button" }, [
      icons.close(),
    ]);

    const element = h("div", { class: "toast", "data-tone": toast.tone, role: "status" }, [
      h("span", { class: "toast-icon" }, [toast.tone === "error" ? "!" : icons.check()]),
      h("div", { class: "toast-body" }, [
        h("span", { class: "toast-title" }, [toast.title]),
        ...(toast.text !== undefined && toast.text !== ""
          ? [h("span", { class: "toast-text" }, [toast.text])]
          : []),
      ]),
      ...(toast.link
        ? [
            h("a", { href: toast.link.href, rel: "noreferrer", target: "_blank" }, [
              toast.link.label,
            ]),
          ]
        : []),
      close,
    ]);

    let timer: ReturnType<typeof setTimeout> | undefined;

    const leave = () => {
      clearTimeout(timer);
      element.dataset.leaving = "";
      setTimeout(() => {
        element.remove();
        resolve();
      }, LEAVE_MS);
    };

    timer = setTimeout(leave, TOAST_MS);
    element.addEventListener("pointerenter", () => {
      clearTimeout(timer);
    });
    element.addEventListener("pointerleave", () => {
      timer = setTimeout(() => {
        leave();
      }, TOAST_MS / 2);
    });
    close.addEventListener("click", () => {
      leave();
    });
    root.append(element);
  });
