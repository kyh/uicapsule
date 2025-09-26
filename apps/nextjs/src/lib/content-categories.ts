/**
 * Represents a filter category for content components
 */
export type ContentFilter = {
  name: string;
  slug: string;
  subcategories?: { name: string; slug: string }[];
};

// Filter categories for organizing content components
export const contentApps: ContentFilter[] = [];

export const contentCategories: ContentFilter[] = [
  { name: "AI", slug: "ai" },
  { name: "Productivity", slug: "productivity" },
  { name: "Social", slug: "social" },
  { name: "Entertainment", slug: "entertainment" },
  { name: "Education", slug: "education" },
  { name: "Finance", slug: "finance" },
  { name: "Health & Fitness", slug: "health-fitness" },
  { name: "Design", slug: "design" },
  { name: "Business", slug: "business" },
  { name: "Games", slug: "games" },
  { name: "Utilities", slug: "utilities" },
];

export const contentStyles: ContentFilter[] = [
  { name: "Minimal", slug: "minimal" },
  { name: "Skeuomorphism", slug: "skeuomorphism" },
  { name: "Colorful", slug: "colorful" },
  { name: "Monochrome", slug: "monochrome" },
  { name: "Cyberpunk", slug: "cyberpunk" },
  { name: "Typographic", slug: "typographic" },
  { name: "Geometric", slug: "geometric" },
  { name: "Retro", slug: "retro" },
  { name: "Silly", slug: "silly" },
  { name: "Pixel Art", slug: "pixel-art" },
];

export const contentElements: ContentFilter[] = [
  {
    name: "Control",
    slug: "control",
    subcategories: [
      { name: "Buttons and Links", slug: "buttons-and-links" },
      { name: "Inputs", slug: "inputs" }, // Text, Number, Slider, Pickers, Combobox, etc.
      { name: "Video & Audio", slug: "video-audio" },
    ],
  },
  {
    name: "View",
    slug: "view",
    subcategories: [
      { name: "Cards", slug: "cards" },
      { name: "Carousels", slug: "carousels" },
      { name: "Grids", slug: "grids" },
      { name: "Navigation", slug: "navigation" }, // Sidebar, Tabs, etc.
      { name: "Tables", slug: "tables" },
      { name: "Toolbars", slug: "toolbars" }, // Filter/Sort
      { name: "Trees", slug: "trees" },
      { name: "Effects", slug: "effects" },
    ],
  },
  {
    name: "Overlay",
    slug: "overlay",
    subcategories: [
      { name: "Dialog and Drawer", slug: "dialog-and-drawer" },
      {
        name: "Dropdown, Popovers, and Tooltips",
        slug: "dropdown-popovers-and-tooltips",
      },
      { name: "Toast", slug: "toast" },
    ],
  },
  {
    name: "Templates",
    slug: "templates",
    subcategories: [
      { name: "Landing Pages", slug: "landing-pages" },
      { name: "Dashboard Pages", slug: "dashboard-pages" },
    ],
  },
];
