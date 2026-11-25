import { h, icons } from "./dom";

export type FieldKey = "credit.name" | "credit.url" | "description" | "name";

const FIELD_KEYS: FieldKey[] = ["name", "description", "credit.name", "credit.url"];
const MAC = navigator.userAgent.includes("Mac");

const field = (key: FieldKey, control: HTMLInputElement | HTMLTextAreaElement) => {
  const error = h("span", { class: "error", hidden: "" });
  const wrapper = h("label", { class: "field", "data-key": key }, [control, error]);

  return { control, error, wrapper };
};

/** The modal that opens over the page once a capture is taken: preview, request fields, File. */
export const createDetails = (options: { onCancel: () => void; onSubmit: () => void }) => {
  const shot = h("canvas", { "aria-label": "Captured area", class: "shot", role: "img" });
  const badge = h("span", { class: "badge" });
  const chipText = h("span");

  const chip = h("span", { class: "chip", hidden: "" }, [
    h("span", { class: "chip-dot" }),
    chipText,
  ]);

  const where = h("p", { class: "where" });

  const close = h("button", { "aria-label": "Close", class: "icon-btn", type: "button" }, [
    icons.close(),
  ]);

  const fields = {
    "credit.name": field(
      "credit.name",
      h("input", { autocomplete: "name", placeholder: "Credit name (optional)" }),
    ),
    "credit.url": field(
      "credit.url",
      h("input", { placeholder: "Credit link (optional)", type: "url" }),
    ),
    description: field(
      "description",
      h("textarea", {
        placeholder: "What does it do? Describe what moves and what it responds to.",
        rows: "3",
      }),
    ),
    name: field("name", h("input", { placeholder: "Name it, like “Shutter button”" })),
  } satisfies Record<FieldKey, ReturnType<typeof field>>;

  const problem = h("p", { class: "error", hidden: "", role: "alert" });
  const target = h("span");
  const cancel = h("button", { class: "btn", type: "button" }, ["Cancel"]);

  const submit = h("button", { class: "btn", "data-primary": "", type: "button" }, [
    "File request",
  ]);

  const dialog = h(
    "div",
    { "aria-labelledby": "uicapsule-title", "aria-modal": "true", class: "dialog", role: "dialog" },
    [
      h("div", { class: "dialog-head" }, [
        h("h2", { class: "dialog-title", id: "uicapsule-title" }, ["Request a component"]),
        close,
      ]),
      h("div", { class: "preview" }, [shot, badge, chip]),
      where,
      fields.name.wrapper,
      fields.description.wrapper,
      h("div", { class: "row" }, [fields["credit.name"].wrapper, fields["credit.url"].wrapper]),
      problem,
      h("div", { class: "dialog-foot" }, [
        h("div", { class: "leading" }, [target, h("kbd", {}, [MAC ? "⌘ ↵" : "Ctrl ↵"])]),
        h("div", { class: "buttons" }, [cancel, submit]),
      ]),
    ],
  );

  const element = h("div", {}, [h("div", { class: "backdrop" }), dialog]);

  close.addEventListener("click", () => options.onCancel());
  cancel.addEventListener("click", () => options.onCancel());
  submit.addEventListener("click", () => options.onSubmit());

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      options.onSubmit();
    }
  });

  return {
    element,
    fields,
    focus: () => fields.name.control.focus(),
    setBusy: (busy: boolean) => {
      submit.disabled = busy;
      submit.textContent = busy ? "Filing…" : "File request";
    },
    setChip: (state: "attached" | "linked" | "working" | null, text = "") => {
      chip.hidden = state === null;
      chip.dataset.state = state ?? "";
      chipText.textContent = text;
    },
    setErrors: (errors: Partial<Record<FieldKey, string>>) => {
      for (const key of FIELD_KEYS) {
        const entry = fields[key];
        const message = errors[key];
        entry.wrapper.toggleAttribute("data-invalid", Boolean(message));
        entry.error.hidden = !message;
        entry.error.textContent = message ?? "";
      }
    },
    setProblem: (message: string | null) => {
      problem.hidden = !message;
      problem.textContent = message ?? "";
    },
    setShot: async (file: File, size: { height: number; width: number }) => {
      const bitmap = await createImageBitmap(file);
      shot.width = bitmap.width;
      shot.height = bitmap.height;
      shot.getContext("2d")?.drawImage(bitmap, 0, 0);
      bitmap.close();
      badge.textContent = `${Math.round(size.width)} × ${Math.round(size.height)}`;
    },
    setTarget: (host: string) => {
      target.textContent = `Filing to ${host}`;
    },
    setWhere: (text: string) => {
      where.textContent = text;
    },
  };
};

export type Details = ReturnType<typeof createDetails>;
