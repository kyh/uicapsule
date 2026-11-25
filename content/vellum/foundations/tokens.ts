export interface ColorRole {
  token: string;
  role: string;
  use: string;
  not?: string;
}

export const SURFACES: readonly ColorRole[] = [
  {
    not: "a panel or a field",
    role: "The vellum under everything, a shade below paper",
    token: "page",
    use: "what everything else is laid on",
  },
  {
    not: "the app ground",
    role: "The sheet you write on",
    token: "paper",
    use: "panels, inputs, menus, your messages",
  },
  {
    not: "a well or a track",
    role: "The grey binding a panel sits in",
    token: "shell",
    use: "the rim around a panel and the footer strip on it",
  },
  {
    not: "a container of other things",
    role: "A pressed-in well",
    token: "field",
    use: "a track, a code well, a disabled pill, an avatar",
  },
  {
    not: "a surface",
    role: "Iron-gall ink, solid",
    token: "ink",
    use: "chart strokes and tooltip grounds; the source of every grey",
  },
];

export const GREYS: readonly ColorRole[] = [
  { role: "Ink at 80%", token: "ink-80", use: "text-1, the focus ring" },
  {
    not: "a placeholder",
    role: "Ink at 62%",
    token: "ink-60",
    use: "text-2, the lowest ink for reading",
  },
  {
    not: "a sentence",
    role: "Ink at 45%",
    token: "ink-45",
    use: "text-3, an empty control's edge",
  },
  {
    role: "Roughly a third of the ink",
    token: "ink-32",
    use: "an input holding the caret; labels of switched-off controls",
  },
  { role: "Ink at 15%", token: "ink-15", use: "an idle input's outline" },
  { role: "Ink at 10%", token: "ink-10", use: "the ring around menus and dialogs, a held row" },
  { role: "Ink at 6%", token: "ink-06", use: "card rims, rules between rows, hover" },
  {
    not: "anything that must read",
    role: "Ink at 3%",
    token: "ink-03",
    use: "the fill under a chart line, the barest tint",
  },
];

export const STATUS: readonly ColorRole[] = [
  {
    not: "a brand or a series",
    role: "Verdigris, done",
    token: "ok",
    use: "a done glyph, green glass",
  },
  { role: "Verdigris dark enough to read", token: "ok-text", use: "Passed, Holds, Agreed" },
  { role: "A pale verdigris wash", token: "ok-tint", use: "behind a done badge or alert" },
  { not: "waiting on a person", role: "Ochre, warning", token: "warn", use: "a warning glyph" },
  { role: "Ochre dark enough to read", token: "warn-text", use: "Flaky, Partly done" },
  { role: "A pale ochre wash", token: "warn-tint", use: "behind a warning badge or alert" },
  {
    not: "focus or a heading",
    role: "Vermilion, failed",
    token: "fail",
    use: "a failure glyph, coral glass",
  },
  { role: "Vermilion dark enough to read", token: "fail-text", use: "Failed, Regressed, an error" },
  { role: "A pale vermilion wash", token: "fail-tint", use: "behind a failure badge or alert" },
];

export const TEXT: readonly ColorRole[] = [
  { role: "First voice", token: "text-1", use: "everything a person must read first" },
  { not: "a placeholder", role: "Second voice", token: "text-2", use: "notes, hints, meta" },
  {
    not: "anything you need to read",
    role: "Below reading",
    token: "text-3",
    use: "a placeholder, a glyph by its label",
  },
  {
    role: "Switched off",
    token: "text-disabled",
    use: "labels of controls that are off; exempt from contrast",
  },
  { role: "On solid ink", token: "text-inverse", use: "a tooltip" },
];

export interface ContrastPair {
  label: string;
  foreground: string;
  backgrounds: readonly string[];
  over?: string;
  needs: number;
}

export const CONTRAST: readonly ContrastPair[] = [
  {
    backgrounds: ["paper", "page", "shell"],
    foreground: "text-1",
    label: "text-1 over paper, page and shell",
    needs: 4.5,
  },
  {
    backgrounds: ["paper", "page", "shell"],
    foreground: "text-2",
    label: "text-2 over paper, page and shell",
    needs: 4.5,
  },
  { backgrounds: ["field"], foreground: "text-2", label: "text-2 in a field", needs: 4.5 },
  {
    backgrounds: ["paper"],
    foreground: "text-3",
    label: "text-3 on paper, never a sentence",
    needs: 3,
  },
  {
    backgrounds: ["paper", "page"],
    foreground: "ok-text",
    label: "ok-text on paper, page",
    needs: 4.5,
  },
  { backgrounds: ["ok-tint"], foreground: "ok-text", label: "ok-text on its tint", needs: 4.5 },
  {
    backgrounds: ["paper", "page"],
    foreground: "warn-text",
    label: "warn-text on paper, page",
    needs: 4.5,
  },
  {
    backgrounds: ["warn-tint"],
    foreground: "warn-text",
    label: "warn-text on its tint",
    needs: 4.5,
  },
  {
    backgrounds: ["paper", "page"],
    foreground: "fail-text",
    label: "fail-text on paper, page",
    needs: 4.5,
  },
  {
    backgrounds: ["fail-tint"],
    foreground: "fail-text",
    label: "fail-text on its tint",
    needs: 4.5,
  },
  {
    backgrounds: ["glass-ink-base"],
    foreground: "glass-text",
    label: "ink glass label",
    needs: 4.5,
    over: "paper",
  },
  {
    backgrounds: ["glass-coral-base"],
    foreground: "glass-text",
    label: "vermilion glass label",
    needs: 4.5,
    over: "paper",
  },
  {
    backgrounds: ["glass-green-base"],
    foreground: "glass-text",
    label: "verdigris glass label",
    needs: 4.5,
    over: "paper",
  },
  {
    backgrounds: ["paper"],
    foreground: "line-strong",
    label: "line-strong, an empty checkbox",
    needs: 3,
  },
];

export const COLOR_TOKENS = [
  ...new Set([
    ...[SURFACES, GREYS, STATUS, TEXT].flatMap((group) => group.map((item) => item.token)),
    ...CONTRAST.flatMap((pair) => [pair.foreground, ...pair.backgrounds]),
  ]),
];
