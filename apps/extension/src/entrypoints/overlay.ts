import { overlayMessageSchema } from "@/lib/messages";
import { mountOverlay } from "@/lib/overlay/mount";

const INSTALLED = "data-uicapsule-capture";

export default defineUnlistedScript(() => {
  if (document.documentElement.hasAttribute(INSTALLED)) {
    return;
  }

  document.documentElement.setAttribute(INSTALLED, "");

  let overlay: ReturnType<typeof mountOverlay> | undefined;

  const open = () => {
    overlay ??= mountOverlay(() => {
      overlay = undefined;
    });

    return overlay;
  };

  browser.runtime.onMessage.addListener((message) => {
    const parsed = overlayMessageSchema.safeParse(message);

    if (!parsed.success) {
      return;
    }

    if (parsed.data.type === "overlay:start") {
      open().start(parsed.data);
    } else if (overlay) {
      overlay.destroy();
    } else {
      open().start({ tool: "region", type: "overlay:start" });
    }
  });
});
