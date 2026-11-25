import { AGENT_NAMES, Agents } from "./agents";
import { ACTION_NAMES, Actions, INPUT_NAMES, Inputs, SELECTION_NAMES, Selection } from "./controls";
import { CHART_NAMES, CODE_NAMES, Charts, Code, DATA_NAMES, Data } from "./data";
import { DISPLAY_NAMES, Display } from "./display";
import { FEEDBACK_NAMES, Feedback } from "./feedback";
import { OVERLAY_NAMES, Overlays } from "./overlays";
import { LAYOUT_NAMES, Layout, NAVIGATION_NAMES, Navigation } from "./structure";

export const CATEGORIES = [
  { Component: Actions, id: "actions", names: ACTION_NAMES, title: "Actions" },
  { Component: Inputs, id: "inputs", names: INPUT_NAMES, title: "Inputs" },
  { Component: Selection, id: "selection", names: SELECTION_NAMES, title: "Selection" },
  { Component: Display, id: "display", names: DISPLAY_NAMES, title: "Display" },
  { Component: Feedback, id: "feedback", names: FEEDBACK_NAMES, title: "Feedback" },
  { Component: Overlays, id: "overlays", names: OVERLAY_NAMES, title: "Overlays" },
  { Component: Navigation, id: "navigation", names: NAVIGATION_NAMES, title: "Navigation" },
  { Component: Layout, id: "layout", names: LAYOUT_NAMES, title: "Layout" },
  { Component: Data, id: "data", names: DATA_NAMES, title: "Data" },
  { Component: Code, id: "code", names: CODE_NAMES, title: "Code" },
  { Component: Charts, id: "charts", names: CHART_NAMES, title: "Charts" },
  { Component: Agents, id: "agents", names: AGENT_NAMES, title: "Runs and agents" },
] as const;

export const COMPONENT_COUNT = CATEGORIES.reduce((sum, category) => sum + category.names.length, 0);
