import {
  ChevronDown,
  ChevronRight,
  Copy,
  Ellipsis,
  ExternalLink,
  ListFilter,
  Pause,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";

import { Button } from "../components/button";
import { Icon } from "../components/icon";
import { Foundation, Rules, Stage } from "./section";

const GLYPHS = [
  { glyph: Copy, name: "Copy" },
  { glyph: X, name: "Close" },
  { glyph: Search, name: "Search" },
  { glyph: Ellipsis, name: "More" },
  { glyph: ExternalLink, name: "Opens elsewhere" },
  { glyph: ChevronRight, name: "Open row" },
  { glyph: ChevronDown, name: "Open list" },
  { glyph: Plus, name: "Create" },
  { glyph: ListFilter, name: "Filter" },
  { glyph: Pause, name: "Pause" },
  { glyph: RotateCcw, name: "Replay" },
] as const;

export const IconFoundation = () => (
  <Foundation
    id="iconography"
    lede="A short list of outline glyphs at one stroke, only for actions people find by shape. Kinds are words, not pictures, and no icon is ever colored."
    title="Iconography"
  >
    <Stage>
      <ul className="fj-glyphs">
        {GLYPHS.map((entry) => (
          <li key={entry.name}>
            <span className="fj-glyph-cell">
              <Icon icon={entry.glyph} />
            </span>
            <span className="fj-t-label-sm fj-c-2">{entry.name}</span>
          </li>
        ))}
      </ul>
    </Stage>
    <div className="fj-two">
      <Stage>
        <p className="fj-t-label">Sizes</p>
        <div className="fj-hstack" data-gap="16">
          <span className="fj-hstack" data-gap="4">
            <Icon icon={ChevronRight} size={12} />
            <span className="fj-t-body-sm fj-c-2">12, carets and checks</span>
          </span>
          <span className="fj-hstack" data-gap="4">
            <Icon icon={Copy} />
            <span className="fj-t-body-sm fj-c-2">16, everywhere else</span>
          </span>
          <span className="fj-hstack" data-gap="4">
            <Icon icon={Search} size={20} />
            <span className="fj-t-body-sm fj-c-2">20, rare large targets</span>
          </span>
        </div>
        <div className="fj-hstack">
          <Button aria-label="Copy run id" size="icon-sm" variant="ghost">
            <Icon icon={Copy} />
          </Button>
          <span className="fj-t-body-sm fj-c-2">
            An icon-only button always carries an aria-label.
          </span>
        </div>
      </Stage>
      <Rules
        items={[
          {
            id: "icon-one-stroke",
            text: "Every glyph goes through Icon: 1.75 stroke, ink, aria-hidden unless named. No component passes its own stroke or color.",
          },
          {
            id: "icon-actions-only",
            text: "Icons mark actions found by shape: copy, close, search, more. A menu of words needs no glyph before each word.",
          },
          {
            id: "icon-no-kind-pictures",
            text: "No robot for an agent and no padlock for a secret. A kind is written out in its Badge.",
          },
        ]}
      />
    </div>
  </Foundation>
);
