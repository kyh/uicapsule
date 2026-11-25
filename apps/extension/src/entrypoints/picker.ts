import { toggleSchema } from "@/lib/messages";
import { mountToolbar } from "@/lib/toolbar/toolbar";

const INSTALLED = "data-uicapsule-capture";

export default defineUnlistedScript(() => {
  if (document.documentElement.hasAttribute(INSTALLED)) {
    return;
  }

  document.documentElement.setAttribute(INSTALLED, "");

  let close: (() => void) | undefined;

  browser.runtime.onMessage.addListener((message) => {
    if (!toggleSchema.safeParse(message).success) {
      return;
    }

    if (close) {
      close();
    } else {
      close = mountToolbar(() => {
        close = undefined;
      });
    }
  });
});
