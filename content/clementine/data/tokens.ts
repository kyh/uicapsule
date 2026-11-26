export interface ColorGroup {
  name: string;
  note: string;
  tokens: readonly { token: string; role: string }[];
}

export const COLOR_GROUPS = [
  {
    name: "Accent",
    note: "Clementine orange marks the next step, a switch that is on and a goal that is filling. It is never a fill for a page or a card.",
    tokens: [
      { role: "The glowing action, a switch that is on, a goal bar", token: "--accent" },
      { role: "The same action under the pointer", token: "--accent-hover" },
      { role: "The same action held down", token: "--accent-active" },
      { role: "A chosen row or chip, whose words stay ink", token: "--accent-wash" },
      { role: "Focus rings, and orange lines or icons on white", token: "--accent-line" },
      { role: "The ring of zest around the glowing action", token: "--glow-ring" },
    ],
  },
  {
    name: "Surfaces",
    note: "Warm paper in four steps. Each step does one job, so you can tell resting, hovered and pressed apart without a border.",
    tokens: [
      { role: "The page itself", token: "--page" },
      { role: "Panels, wells and text fields", token: "--surface" },
      { role: "Controls at rest, a row under the pointer", token: "--surface-2" },
      { role: "Pressed controls and empty tracks", token: "--surface-3" },
      { role: "Menus, dialogs and sheets", token: "--raised" },
    ],
  },
  {
    name: "Text and ink",
    note: "Ink is a brown-black, never pure black. It also fills the one strong action that is not the glowing one.",
    tokens: [
      { role: "Headings, body and labels", token: "--fg" },
      { role: "Sentences that explain, table cells", token: "--fg-2" },
      { role: "Hints inside fields, quiet icons", token: "--fg-3" },
      { role: "Labels of controls you cannot use yet", token: "--fg-disabled" },
      { role: "The solid button, tooltips, the toast", token: "--ink" },
    ],
  },
  {
    name: "Lines",
    note: "Hairlines only separate. Anything you can press gets the darker step, which clears 3:1.",
    tokens: [
      { role: "Dividers and the edges of frames", token: "--line" },
      { role: "Edges of fields and chips", token: "--line-strong" },
      { role: "Checkbox, radio and switch outlines", token: "--control" },
    ],
  },
  {
    name: "Status",
    note: "Green, ochre and red, and each one always travels with a label or a glyph. Clementine keeps no blue in the box.",
    tokens: [
      { role: "Paid, paired, done", token: "--success" },
      { role: "Running low, worth a second look", token: "--warn" },
      { role: "Declined, short, locked", token: "--danger" },
      { role: "Behind a success note", token: "--success-tint" },
      { role: "Behind a low balance or a mismatch", token: "--warn-tint" },
      { role: "Behind an error message", token: "--danger-tint" },
    ],
  },
] as const satisfies readonly ColorGroup[];

export const CONTRAST_PAIRS = [
  { bg: "--page", fg: "--fg", needs: 4.5 },
  { bg: "--surface", fg: "--fg", needs: 4.5 },
  { bg: "--page", fg: "--fg-2", needs: 4.5 },
  { bg: "--surface-2", fg: "--fg-2", needs: 4.5 },
  { bg: "--page", fg: "--fg-3", needs: 4.5 },
  { bg: "--surface", fg: "--fg-3", needs: 4.5 },
  { bg: "--accent", fg: "--on-accent", needs: 4.5 },
  { bg: "--glow-from", fg: "--on-accent", needs: 4.5 },
  { bg: "--glow-to", fg: "--on-accent", needs: 4.5 },
  { bg: "--glow-danger-from", fg: "--on-danger", needs: 4.5 },
  { bg: "--glow-danger-to", fg: "--on-danger", needs: 4.5 },
  { bg: "--accent-wash", fg: "--fg", needs: 4.5 },
  { bg: "--ink", fg: "--fg-inverse", needs: 4.5 },
  { bg: "--page", fg: "--success-text", needs: 4.5 },
  { bg: "--warn-tint", fg: "--warn-text", needs: 4.5 },
  { bg: "--danger-tint", fg: "--danger-text", needs: 4.5 },
  { bg: "--success", fg: "--on-status", needs: 3 },
  { bg: "--warn", fg: "--on-status", needs: 3 },
  { bg: "--page", fg: "--accent-line", needs: 3 },
  { bg: "--surface-2", fg: "--control", needs: 3 },
  { bg: "--page", fg: "--accent", needs: 3, wrong: true },
] as const;

export const TYPE_SCALE = [
  {
    job: "The balance and other display figures",
    leading: "--leading-tight",
    figure: 3182.47,
    name: "--text-3xl",
    sample: "",
    weight: 500,
  },
  {
    job: "The page title",
    leading: "--leading-tight",
    name: "--text-2xl",
    sample: "Payday plan",
    weight: 600,
  },
  {
    job: "Section, dialog and sheet titles",
    leading: "--leading-tight",
    name: "--text-xl",
    sample: "Before payday",
    weight: 600,
  },
  {
    job: "Card headings and empty states",
    leading: "--leading-tight",
    name: "--text-lg",
    sample: "Kyoto in April",
    weight: 600,
  },
  {
    job: "Chat, long sentences, phone fields",
    leading: "--leading-normal",
    name: "--text-base",
    sample: "Your pay lands Friday at 6:00 am.",
    weight: 400,
  },
  {
    job: "Buttons, rows and any sentence with a number",
    leading: "--leading-snug",
    name: "--text-sm",
    sample: "Lock card",
    weight: 500,
  },
  {
    job: "Tab bar words, badges, counters",
    leading: "--leading-snug",
    name: "--text-xs",
    sample: "Today, 8:12 am",
    weight: 400,
  },
] as const;

export const SPACE_STEPS = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64] as const;

export const SPACE_USES = [
  { gap: "4px", use: "A title to its own description" },
  { gap: "8px", use: "An icon to its word, chips in a row" },
  { gap: "12px", use: "Rows in a list, items in a stack" },
  { gap: "16px", use: "Fields in a form, specimen gaps" },
  { gap: "20 to 24px", use: "Padding inside panels and sheets" },
  { gap: "48 to 72px", use: "Between the big sections of a page" },
] as const;

export const RADII = [
  { name: "--radius-control", role: "Buttons, fields, keys and the balance chip" },
  { name: "--radius-pill", role: "Chips, badges, amounts, switches and segments" },
  { name: "--radius-panel", role: "Panels, menus, popovers and the section dock" },
  { name: "--radius-sheet", role: "Dialogs, sheets and the screen frames" },
  { name: "--radius-md", role: "Items inside a menu panel" },
  { name: "--radius-sm", role: "A checkbox, an inline rule field" },
] as const;

export const ELEVATION = [
  { level: "Page", note: "Warm white. Nothing sits under it.", token: "--page" },
  { level: "Surface", note: "One paper step down. Panels that stay put.", token: "--surface" },
  {
    level: "Lifted",
    note: "A short, tight shadow for something you can pick up.",
    token: "--shadow-card",
  },
  {
    level: "Menu",
    note: "Popover, menu and the section dock, with a faint outline.",
    token: "--shadow-menu",
  },
  { level: "Overlay", note: "Dialogs and sheets over the scrim.", token: "--shadow-overlay" },
] as const;

export const DURATIONS = [
  { token: "--dur-instant", use: "Color on hover and press, the 0.97 squeeze" },
  { token: "--dur-fast", use: "Switches, checkboxes, chips, tooltips, anything leaving" },
  { token: "--dur-base", use: "Popovers, menus, tab lines, the pay ring, a panel opening" },
  { token: "--dur-slow", use: "A dialog or a sheet arriving" },
] as const;

export const CURVES = [
  {
    token: "--ease-out",
    use: "Every arrival and every change. Quick off the mark, then a long soft landing.",
  },
  {
    token: "--ease-in",
    use: "Only for leaving. It gathers speed and is gone, a little faster than it came.",
  },
] as const;

export const ALL_LIVE_TOKENS = [
  ...new Set([
    ...COLOR_GROUPS.flatMap((group) => group.tokens.map((item) => item.token)),
    ...CONTRAST_PAIRS.flatMap((pair) => [pair.fg, pair.bg]),
    ...TYPE_SCALE.flatMap((step) => [step.name, step.leading]),
    ...RADII.map((item) => item.name),
    ...DURATIONS.map((item) => item.token),
    ...CURVES.map((item) => item.token),
    "--tracking-tight",
  ]),
];
