import { overlayStartSchema } from "@/lib/messages";
import { mountOverlay } from "@/lib/overlay/overlay";

const INSTALLED = "data-uicapsule-capture";

export default defineUnlistedScript(() => {
  if (document.documentElement.hasAttribute(INSTALLED)) {
    return;
  }

  document.documentElement.setAttribute(INSTALLED, "");

  let overlay: ReturnType<typeof mountOverlay> | undefined;

  browser.runtime.onMessage.addListener((message) => {
    const start = overlayStartSchema.safeParse(message);

    if (!start.success) {
      return;
    }

    overlay ??= mountOverlay(() => {
      overlay = undefined;
    });
    void overlay.start(start.data);
  });
});
