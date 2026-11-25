import { h } from "./dom";

export type FieldKey = "credit.name" | "credit.url" | "description" | "name";

const FIELD_KEYS: FieldKey[] = ["name", "description", "credit.name", "credit.url"];

const field = (key: FieldKey, control: HTMLInputElement | HTMLTextAreaElement) => {
  const error = h("span", { class: "error", hidden: "" });
  const wrapper = h("label", { class: "field", "data-key": key }, [control, error]);

  return { control, error, wrapper };
};

/** The request card that opens above the bar once a capture is snapped. */
export const createCard = () => {
  const shot = h("canvas", { "aria-label": "Captured area", class: "shot", role: "img" });
  const where = h("span", { class: "meta-where" });
  const chipText = h("span");

  const chip = h("span", { class: "chip", hidden: "" }, [
    h("span", { class: "chip-dot" }),
    chipText,
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
      }),
    ),
    name: field("name", h("input", { placeholder: "Name it, like “Shutter button”" })),
  } satisfies Record<FieldKey, ReturnType<typeof field>>;

  const problem = h("p", { class: "error", hidden: "" });

  const form = h("div", { class: "form" }, [
    shot,
    h("div", { class: "meta" }, [where, chip]),
    fields.name.wrapper,
    fields.description.wrapper,
    h("div", { class: "row" }, [fields["credit.name"].wrapper, fields["credit.url"].wrapper]),
    problem,
  ]);

  form.style.cssText = "display: flex; flex-direction: column; gap: 10px;";
  const done = h("div", { class: "done", hidden: "" });
  const element = h("div", { class: "card", hidden: "" }, [form, done]);

  const setErrors = (errors: Partial<Record<FieldKey, string>>) => {
    for (const key of FIELD_KEYS) {
      const entry = fields[key];
      const message = errors[key];
      entry.wrapper.toggleAttribute("data-invalid", Boolean(message));
      entry.error.hidden = !message;
      entry.error.textContent = message ?? "";
    }
  };

  return {
    element,
    fields,
    open: () => {
      element.hidden = false;
      element.getBoundingClientRect();
      element.classList.add("is-open");
    },
    close: () => {
      element.classList.remove("is-open");
      element.hidden = true;
    },
    setChip: (state: "attached" | "linked" | "working" | null, text = "") => {
      chip.hidden = state === null;
      chip.dataset.state = state ?? "";
      chipText.textContent = text;
    },
    setDone: (filed: { number?: number; url: string } | null) => {
      form.hidden = filed !== null;
      form.style.display = filed ? "none" : "flex";
      done.hidden = filed === null;

      if (filed) {
        const link = h("a", { href: filed.url, rel: "noreferrer", target: "_blank" }, [
          "View it on GitHub",
        ]);

        done.replaceChildren(
          h("span", { class: "done-title" }, [
            filed.number ? `Request #${filed.number} filed` : "Request filed",
          ]),
          h("p", {}, ["If it gets built, it lands in the gallery with your credit."]),
          link,
        );
      }
    },
    setErrors,
    setProblem: (message: string | null) => {
      problem.hidden = !message;
      problem.textContent = message ?? "";
    },
    setShot: async (file: File) => {
      const bitmap = await createImageBitmap(file);
      shot.width = bitmap.width;
      shot.height = bitmap.height;
      shot.getContext("2d")?.drawImage(bitmap, 0, 0);
      bitmap.close();
    },
    setWhere: (text: string) => {
      where.textContent = text;
    },
  };
};

export type Card = ReturnType<typeof createCard>;
