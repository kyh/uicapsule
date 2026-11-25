/** Every component the showcase specimens, by group: the counts on the page are read from here. */
export const CATALOG = {
  actions: {
    paths: ["actions/button", "actions/button-group", "actions/copy-button"],
    title: "Actions",
  },
  charts: {
    paths: ["charts/stem-chart", "charts/bar-blocks", "charts/chart", "charts/swimlanes"],
    title: "Charts",
  },
  code: {
    paths: ["code/code-window", "code/json-view", "code/schema-diff", "code/log-viewer"],
    title: "Code",
  },
  data: { paths: ["data/table", "data/filter-bar"], title: "Data" },
  display: {
    paths: [
      "display/status-strip",
      "display/tag",
      "display/kbd",
      "display/avatar",
      "display/data-list",
    ],
    title: "Display",
  },
  feedback: {
    paths: [
      "feedback/status",
      "feedback/meter",
      "feedback/progress",
      "feedback/alert",
      "feedback/toast",
      "feedback/empty-state",
      "feedback/skeleton",
    ],
    title: "Feedback",
  },
  inputs: { paths: ["inputs/field", "inputs/select", "inputs/textarea"], title: "Inputs" },
  navigation: {
    paths: [
      "navigation/tabs",
      "navigation/numbered-tabs",
      "navigation/breadcrumb",
      "navigation/pagination",
    ],
    title: "Navigation",
  },
  overlays: {
    paths: [
      "overlays/dialog",
      "overlays/popover",
      "overlays/tooltip",
      "overlays/dropdown-menu",
      "overlays/command",
    ],
    title: "Overlays",
  },
  runs: {
    paths: ["runs/tool-call-row", "runs/activity", "runs/prompt-input"],
    title: "Runs and agents",
  },
  selection: {
    paths: [
      "selection/checkbox",
      "selection/radio-group",
      "selection/switch",
      "selection/slider",
      "selection/segmented-control",
    ],
    title: "Selection",
  },
} as const;

export type GroupKey = keyof typeof CATALOG;

/** "3 components", "1 component". */
export const countOf = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

/** The id, title and count line a specimen group heads itself with. */
export const groupHead = (key: GroupKey) => ({
  id: `c-${key}`,
  meta: countOf(CATALOG[key].paths.length, "component"),
  title: CATALOG[key].title,
});

export const COMPONENT_TOTAL = Object.values(CATALOG).reduce<number>(
  (sum, group) => sum + group.paths.length,
  0,
);

export const GROUP_TOTAL = Object.keys(CATALOG).length;
