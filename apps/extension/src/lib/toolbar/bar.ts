import type { PickMode } from "../messages";
import { h, icons } from "./dom";
import type { IconName } from "./dom";
import { morphText } from "./morph";

const MODES = [
  { icon: "element", label: "Pick element", mode: "element" },
  { icon: "area", label: "Select area", mode: "area" },
] satisfies { icon: IconName; label: string; mode: PickMode }[];

export interface Preferences {
  html: boolean;
  video: boolean;
}

const CLOSE_MS = 150;

const createTooltip = (group: HTMLElement) => {
  const text = h("span");
  const tip = h("span", { "aria-hidden": "true", class: "tt", role: "tooltip" }, [text]);
  group.append(tip);

  const hide = () => {
    tip.dataset.show = "false";
  };

  const place = (trigger: HTMLElement) => {
    const showing = tip.dataset.show === "true";
    text.textContent = trigger.dataset.tooltip ?? "";
    const width = Math.ceil(text.scrollWidth + 24);
    const groupBox = group.getBoundingClientRect();
    const box = trigger.getBoundingClientRect();
    const x = box.left - groupBox.left + box.width / 2 - width / 2;

    if (!showing) {
      tip.style.transition = "none";
    }

    tip.style.width = `${width}px`;
    tip.style.setProperty("--tt-x", `${x}px`);

    if (!showing) {
      tip.getBoundingClientRect();
      tip.style.transition = "";
    }

    tip.dataset.show = "true";
  };

  group.addEventListener("pointerleave", hide);

  return { hide, place };
};

const createModes = (onSelect: (mode: PickMode) => void) => {
  const pill = h("span", { "aria-hidden": "true", class: "pill" });

  const buttons = MODES.map((entry) =>
    h(
      "button",
      {
        "aria-label": entry.label,
        "aria-selected": entry.mode === "element" ? "true" : "false",
        class: "mode",
        "data-mode": entry.mode,
        "data-tooltip": entry.label,
        role: "tab",
        type: "button",
      },
      [icons[entry.icon]()],
    ),
  );

  const modes = h("div", { "aria-label": "Capture mode", class: "modes", role: "tablist" }, [
    pill,
    ...buttons,
  ]);

  const group = h("span", { class: "tt-group" }, [modes]);
  const tooltip = createTooltip(group);

  const movePill = (button: HTMLElement, animate: boolean) => {
    if (!animate) {
      pill.style.transition = "none";
    }

    pill.style.transform = `translateX(${button.offsetLeft}px)`;
    pill.style.width = `${button.offsetWidth}px`;

    if (!animate) {
      pill.getBoundingClientRect();
      pill.style.transition = "";
    }
  };

  const select = (mode: PickMode, animate: boolean) => {
    for (const button of buttons) {
      const on = button.dataset.mode === mode;
      button.setAttribute("aria-selected", on ? "true" : "false");

      if (on) {
        movePill(button, animate);
      }
    }
  };

  for (const button of buttons) {
    button.addEventListener("pointerenter", () => tooltip.place(button));
    button.addEventListener("focus", () => tooltip.place(button));
    button.addEventListener("blur", tooltip.hide);
    button.addEventListener("click", () => {
      const mode = MODES.find((entry) => entry.mode === button.dataset.mode)?.mode ?? "element";
      select(mode, true);
      onSelect(mode);
    });
  }

  requestAnimationFrame(() => select("element", false));

  return { group, select };
};

const menuItem = (icon: IconName, label: string, checked?: boolean) =>
  h(
    "button",
    {
      "aria-checked": checked === undefined ? undefined : String(checked),
      class: "item",
      role: checked === undefined ? "menuitem" : "menuitemcheckbox",
      type: "button",
    },
    [
      h("span", { class: "item-ic" }, [icons[icon]()]),
      h("span", { class: "item-label" }, [label]),
      ...(checked === undefined ? [] : [h("span", { class: "item-check" }, [icons.tick()])]),
    ],
  );

const createOptions = (preferences: Preferences, onSettings: () => void) => {
  const button = h(
    "button",
    { "aria-expanded": "false", "aria-haspopup": "true", class: "opt", type: "button" },
    [h("span", {}, ["Options"]), h("span", { class: "opt-chev" }, [icons.chevron()])],
  );

  const video = menuItem("video", "Attach video", preferences.video);
  const html = menuItem("code", "Include HTML", preferences.html);
  const settings = menuItem("gear", "Settings");

  const menu = h("div", { class: "menu", role: "menu" }, [
    video,
    html,
    h("div", { class: "menu-sep", role: "separator" }),
    settings,
  ]);

  let closing: ReturnType<typeof setTimeout> | undefined;

  const open = () => {
    clearTimeout(closing);
    menu.classList.remove("is-closing");
    menu.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
  };

  const close = () => {
    if (!menu.classList.contains("is-open")) {
      return false;
    }

    menu.classList.remove("is-open");
    menu.classList.add("is-closing");
    button.setAttribute("aria-expanded", "false");
    closing = setTimeout(() => menu.classList.remove("is-closing"), CLOSE_MS);

    return true;
  };

  const toggle = (item: HTMLElement, key: keyof Preferences) => {
    preferences[key] = !preferences[key];
    item.setAttribute("aria-checked", String(preferences[key]));
  };

  button.addEventListener("click", (event) => {
    event.stopPropagation();

    if (!close()) {
      open();
    }
  });
  video.addEventListener("click", () => toggle(video, "video"));
  html.addEventListener("click", () => toggle(html, "html"));
  settings.addEventListener("click", () => {
    close();
    onSettings();
  });

  return { close, element: h("div", { class: "opt-wrap" }, [button, menu]), menu };
};

const createAction = () => {
  const faces = {
    capture: h("span", { "data-on": "" }, [icons.capture()]),
    check: h("span", {}, [icons.check()]),
    send: h("span", {}, [icons.send()]),
  };

  const label = h("span", { "aria-live": "polite", class: "morph" }, ["Snap"]);

  const button = h("button", { class: "cap", disabled: "", type: "button" }, [
    h("span", { "aria-hidden": "true", class: "swap" }, Object.values(faces)),
    label,
  ]);

  const show = (icon: keyof typeof faces, text: string) => {
    for (const [name, face] of Object.entries(faces)) {
      face.toggleAttribute("data-on", name === icon);
    }

    morphText(label, text);
  };

  return { button, show };
};

/** The floating pill: close, the two capture modes, the options menu and the action button. */
export const createBar = (options: {
  onClose: () => void;
  onMode: (mode: PickMode) => void;
  onSettings: () => void;
  preferences: Preferences;
}) => {
  const close = h("button", { "aria-label": "Close", class: "close", type: "button" }, [
    icons.close(),
  ]);

  const modes = createModes(options.onMode);
  const menu = createOptions(options.preferences, options.onSettings);
  const action = createAction();

  const bar = h("div", { class: "bar" }, [
    modes.group,
    h("span", { class: "sep" }),
    menu.element,
    action.button,
  ]);

  close.addEventListener("click", options.onClose);

  return {
    action,
    closeMenu: menu.close,
    element: h("div", { class: "wrap" }, [close, bar]),
    menu: menu.menu,
    selectMode: modes.select,
  };
};
