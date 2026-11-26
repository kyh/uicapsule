export const system = {
  name: "Vellum",
  tagline:
    "Iron-gall ink on vellum for AI products. Every grey is the same ink thinned, hue is kept for verdicts, and gloss marks only the button you press next.",
};

/** Every component the showcase specimens, by the category it is filed under. */
export const CATEGORIES = [
  { components: ["Button", "Toolbar", "Copy button"], id: "c-actions", title: "Actions" },
  { components: ["Field", "Textarea", "Chip"], id: "c-inputs", title: "Inputs" },
  {
    components: ["Checkbox", "Radio group", "Switch", "Slider", "Segmented control", "Select"],
    id: "c-selection",
    title: "Selection",
  },
  {
    components: ["Card", "Data list", "Badge", "Avatar", "Kbd"],
    id: "c-display",
    title: "Display",
  },
  {
    components: ["Status", "Progress", "Skeleton", "Alert", "Toast", "Empty state"],
    id: "c-feedback",
    title: "Feedback",
  },
  {
    components: ["Dialog", "Popover", "Tooltip", "Dropdown menu"],
    id: "c-overlays",
    title: "Overlays",
  },
  { components: ["Tabs", "Steps"], id: "c-navigation", title: "Navigation" },
  {
    components: ["Table", "Chart", "Status strip", "Code block"],
    id: "c-data",
    title: "Data and code",
  },
  {
    components: [
      "Prompt input",
      "Send button",
      "Message",
      "Reasoning",
      "Tool call",
      "Activity",
      "Tool approval",
      "Action receipt",
      "Autonomy rule",
      "Voice note",
      "Follow-ups",
      "Mention",
    ],
    id: "c-ai",
    title: "Assistants and agents",
  },
] as const;

export const FOUNDATIONS = [
  { id: "f-color", title: "Color" },
  { id: "f-type", title: "Typography" },
  { id: "f-space", title: "Space" },
  { id: "f-radius", title: "Radius" },
  { id: "f-lines", title: "Borders and lines" },
  { id: "f-elevation", title: "Elevation" },
  { id: "f-motion", title: "Motion" },
  { id: "f-icons", title: "Iconography" },
  { id: "f-slop", title: "Anti-slop" },
] as const;

export const SCREENS = [
  { id: "s-notes", title: "Meeting notes" },
  { id: "s-triage", title: "Support triage" },
  { id: "s-docs", title: "Docs answer" },
  { id: "s-routing", title: "Model routing" },
] as const;
