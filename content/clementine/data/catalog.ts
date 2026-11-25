export const FOUNDATIONS = [
  { id: "color", name: "Color" },
  { id: "typography", name: "Typography" },
  { id: "spacing", name: "Spacing" },
  { id: "radius", name: "Radius" },
  { id: "elevation", name: "Elevation" },
  { id: "motion", name: "Motion" },
  { id: "iconography", name: "Iconography" },
  { id: "anti-slop", name: "Anti-slop" },
] as const;

export const SCREENS = [
  { id: "screen-home", name: "Home" },
  { id: "screen-payday", name: "Payday plan" },
  { id: "screen-send", name: "Sending money" },
  { id: "screen-receipts", name: "Receipts and an odd charge" },
] as const;

export const CATEGORIES = [
  { id: "c-actions", items: ["Button", "Copy button"], name: "Actions" },
  {
    id: "c-inputs",
    items: ["Input", "Textarea", "Select", "Keypad", "Stepper", "Dropzone"],
    name: "Inputs",
  },
  {
    id: "c-selection",
    items: ["Checkbox", "Radio", "Switch", "Slider", "Segmented", "Chip"],
    name: "Selection",
  },
  {
    id: "c-display",
    items: [
      "Figure",
      "Amount",
      "Balance",
      "Pay ring",
      "Bill schedule",
      "List",
      "Table",
      "Progress",
      "Badge",
      "Status",
      "Avatar",
    ],
    name: "Display",
  },
  {
    id: "c-feedback",
    items: ["Toast", "Spinner", "Skeleton", "Empty", "Error state"],
    name: "Feedback",
  },
  {
    id: "c-overlays",
    items: ["Dialog", "Popover", "Dropdown menu", "Tooltip"],
    name: "Overlays",
  },
  { id: "c-navigation", items: ["Tabs", "Tab bar", "Accordion"], name: "Navigation" },
  {
    id: "c-assistant",
    items: [
      "Approval request",
      "Action receipt",
      "Autonomy rule",
      "Receipt match",
      "Insight",
      "Split request",
      "Message",
      "Tool call",
      "Follow-ups",
      "Chat input",
    ],
    name: "Assistant and money",
  },
] as const;

export const COMPONENT_COUNT = CATEGORIES.reduce((sum, category) => sum + category.items.length, 0);
