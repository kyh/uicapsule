import * as keys from "constants/keys";
import { keyboardModeAttribute } from "constants/attributes";
import Chain from "utilities/Chain";

export type TrapMode = "dialog" | "action-menu" | "content-menu";
type ReleaseOptions = { withoutFocusReturn?: boolean };
type Release = (options?: ReleaseOptions) => void;
type TrapOptions = {
  onNavigateOutside?: () => void;
  includeTrigger?: boolean;
  mode?: TrapMode;
};
type Trap = Release | null;

export const isKeyboardMode = () =>
  document.body.hasAttribute(keyboardModeAttribute);

export const focusableSelector =
  'a,button,input:not([type="hidden"]),textarea,select,details,[tabindex]:not([tabindex="-1"])';

const getActiveElement = () => {
  return document.activeElement as HTMLButtonElement;
};

const getFocusableElements = (
  el: HTMLElement,
  extraElement?: HTMLButtonElement
) => {
  const focusableElements = Array.from(
    el.querySelectorAll(focusableSelector)
  ) as HTMLButtonElement[];
  const filteredElements = focusableElements.filter((el) => {
    return !el.hasAttribute("disabled") && el.clientHeight > 0;
  });

  if (extraElement && filteredElements.length)
    filteredElements.unshift(extraElement);

  return filteredElements;
};

const getFocusData = (
  root: HTMLElement,
  direction: "next" | "prev" | "first" | "last",
  extraElement?: HTMLButtonElement
) => {
  const focusable = getFocusableElements(root, extraElement);
  const focusableLimit = focusable.length - 1;
  const currentElement = getActiveElement();
  const currentIndex = focusable.indexOf(currentElement);
  let nextIndex = {
    next: currentIndex + 1,
    prev: currentIndex - 1,
    first: 0,
    last: focusableLimit,
  }[direction];

  const isOverflow = nextIndex > focusableLimit || nextIndex < 0;
  if (isOverflow) nextIndex = direction === "prev" ? focusableLimit : 0;

  return { overflow: isOverflow, el: focusable[nextIndex] };
};

const focusElement = (
  root: HTMLElement,
  target: "next" | "prev" | "first" | "last"
) => {
  const data = getFocusData(root, target);
  if (data.el) data.el.focus();
};

export const focusNextElement = (root: HTMLElement) =>
  focusElement(root, "next");
export const focusPreviousElement = (root: HTMLElement) =>
  focusElement(root, "prev");
export const focusFirstElement = (root: HTMLElement) =>
  focusElement(root, "first");
export const focusLastElement = (root: HTMLElement) =>
  focusElement(root, "last");

const trapScreenReader = (() => {
  let affectedElements: HTMLElement[] = [];

  const applyHiddenToSiblings = (el: HTMLElement) => {
    let sibling = el.parentNode && (el.parentNode.firstChild as HTMLElement);

    while (sibling) {
      const notCurrent = sibling !== el;
      const isValid =
        sibling.nodeType === 1 && !sibling.hasAttribute("aria-hidden");

      if (notCurrent && isValid) {
        sibling.setAttribute("aria-hidden", "true");
        affectedElements.push(sibling);
      }

      sibling = sibling.nextSibling as HTMLElement;
    }
  };

  const release = () => {
    affectedElements.forEach((el) => {
      el.removeAttribute("aria-hidden");
    });
    affectedElements = [];
  };

  return (el: HTMLElement) => {
    let currentEl = el;

    if (affectedElements.length) release();

    while (currentEl !== document.body) {
      applyHiddenToSiblings(currentEl);
      currentEl = currentEl.parentElement as HTMLElement;
    }

    return { release };
  };
})();

export const trapFocus = (() => {
  let resetListeners: null | (() => void) = null;
  let srTrap: ReturnType<typeof trapScreenReader> | null = null;
  const chain = new Chain<{ root: HTMLElement; trigger: HTMLButtonElement }>();

  return (root: HTMLElement, options: TrapOptions = {}): Trap => {
    const { mode = "dialog", onNavigateOutside, includeTrigger } = options;
    const triggerElement = getActiveElement();
    const isDialog = mode === "dialog";
    const isContentMenu = mode === "content-menu";
    const isTabMode = isDialog || isContentMenu;
    const isArrowsMode = mode === "action-menu";
    let chainId: number;

    const release: Release = (releaseOptions = {}) => {
      const { withoutFocusReturn } = releaseOptions;
      const keepFocusTrapped = !chain.isLast(chainId);

      if (keepFocusTrapped) return;

      // We're keeping items in the chain when focus was preserver to have access to the original trigger later
      const releaseChainItem = chainId
        ? chain.removePreviousTill(chainId, (item) =>
            document.body.contains(item.data.trigger)
          )
        : undefined;
      const releaseTargetTrigger = releaseChainItem?.trigger || triggerElement;

      if (releaseTargetTrigger) {
        releaseTargetTrigger.focus({
          preventScroll: withoutFocusReturn || !isKeyboardMode(),
        });
      }

      if (!resetListeners) return;

      resetListeners();
      if (srTrap) srTrap.release();
      resetListeners = null;
      srTrap = null;

      if (!chain.isEmpty && releaseChainItem?.root) {
        trapFocus(releaseChainItem.root);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;
      const isTab = key === keys.TAB;
      const isNextTab = isTab && !event.shiftKey;
      const isBackTab = isTab && event.shiftKey;
      const isUp = isArrowsMode && key === keys.UP;
      const isDown = isArrowsMode && key === keys.DOWN;
      const isPrev = (isBackTab && isTabMode) || isUp;
      const isNext = (isNextTab && isTabMode) || isDown;
      const focusData = getFocusData(
        root,
        isPrev ? "prev" : "next",
        includeTrigger ? triggerElement : undefined
      );

      // Release the trap when tab is used in navigation modes that support arrows
      const hasNavigatedOutside =
        (isTab && isArrowsMode) ||
        (isContentMenu && isTab && focusData.overflow);

      if (hasNavigatedOutside) {
        // if (mode !== "content-menu") {
        // event.preventDefault();
        // }

        release();
        if (onNavigateOutside) onNavigateOutside();
        return;
      }

      // We return after the last condition because Tab can be used for releasing in arrows mode
      if (!isPrev && !isNext) return;

      event.preventDefault();
      if (focusData.el) focusData.el.focus();
    };

    // Reset event listeners if focus is trapped elsewhere
    if (resetListeners) resetListeners();
    if (isDialog) srTrap = trapScreenReader(root);

    const focusable = getFocusableElements(
      root,
      includeTrigger ? triggerElement : undefined
    );

    if (!focusable.length) return null;

    chainId = chain.add({ root, trigger: triggerElement });

    focusable[0].focus();

    document.addEventListener("keydown", handleKeyDown);
    resetListeners = () =>
      document.removeEventListener("keydown", handleKeyDown);

    return release;
  };
})();
