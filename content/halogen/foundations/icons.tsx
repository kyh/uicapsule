import {
  Activity,
  ArrowUpRight,
  Ban,
  Check,
  Clock,
  Copy,
  Database,
  Filter,
  GitBranch,
  HardDrive,
  Play,
  RefreshCw,
  Search,
  Server,
  Settings,
  Terminal,
  TriangleAlert,
  Workflow,
} from "lucide-react";
import type { CSSProperties } from "react";

import { Icon } from "../components/icon";

const SET = [
  { icon: Search, name: "Search" },
  { icon: RefreshCw, name: "Refresh" },
  { icon: Copy, name: "Copy" },
  { icon: Filter, name: "Filter" },
  { icon: Play, name: "Run" },
  { icon: Ban, name: "Cancel" },
  { icon: Check, name: "Done" },
  { icon: TriangleAlert, name: "Warn" },
  { icon: Clock, name: "Schedule" },
  { icon: Database, name: "Table" },
  { icon: HardDrive, name: "Storage" },
  { icon: Server, name: "Worker" },
  { icon: Workflow, name: "Pipeline" },
  { icon: GitBranch, name: "Lineage" },
  { icon: Terminal, name: "Logs" },
  { icon: Activity, name: "Activity" },
  { icon: Settings, name: "Settings" },
  { icon: ArrowUpRight, name: "Open" },
];

/** Lucide, squared: square ends, mitred joins, one 1.5px line at every size. */
export const Iconography = () => (
  <div className="hx-stack-4">
    <div className="hx-tiles hx-icon-grid" style={{ "--tiles": 9 } as CSSProperties}>
      {SET.map((item) => (
        <div key={item.name}>
          <Icon icon={item.icon} />
          <span className="hx-micro hx-ink-3">{item.name}</span>
        </div>
      ))}
    </div>
    <div className="hx-tiles" style={{ "--tiles": 3 } as CSSProperties}>
      <div>
        <span className="hx-label-sm hx-ink-3">Sizes</span>
        <span className="hx-row hx-gap-4 hx-icon-sizes">
          {([14, 16, 20, 24] as const).map((size) => (
            <span className="hx-stack hx-gap-1 hx-center" key={size}>
              <Icon icon={Workflow} size={size} />
              <span className="hx-code-sm hx-ink-3">{size}</span>
            </span>
          ))}
        </span>
        <span className="hx-caption hx-ink-2">
          16 is the working size. Compact fields drop to 14; an empty result can carry 24.
        </span>
      </div>
      <div>
        <span className="hx-label-sm hx-ink-3">Square ends</span>
        <span className="hx-row hx-gap-6">
          <span className="hx-stack hx-gap-1 hx-center">
            <Workflow absoluteStrokeWidth aria-hidden size={48} strokeWidth={3} />
            <span className="hx-micro hx-fail-text">Stock, round</span>
          </span>
          <span className="hx-stack hx-gap-1 hx-center">
            <Workflow
              absoluteStrokeWidth
              aria-hidden
              size={48}
              strokeLinecap="square"
              strokeLinejoin="miter"
              strokeWidth={3}
            />
            <span className="hx-micro hx-ok-text">Halogen, square</span>
          </span>
        </span>
        <span className="hx-caption hx-ink-2">
          Shown at 3px so the ends are visible. Stock Lucide finishes each stroke in a bead; Halogen
          cuts it flat, like the corners around it.
        </span>
      </div>
      <div>
        <span className="hx-label-sm hx-ink-3">Where an icon goes</span>
        <span className="hx-caption hx-ink-2">
          A glyph stands in for a word that has no room: a square button with an accessible name,
          the lens in a search field. Once the word fits, the glyph goes. Glyphs stay in ink.
        </span>
      </div>
    </div>
  </div>
);
