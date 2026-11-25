import { Avatar, AvatarGroup } from "../components/avatar";
import { Badge, CodeTag, KINDS, Kbd } from "../components/badge";
import { DataList, RelativeTime, StatStrip } from "../components/data";
import { InkSlot, STATUS_RANK, Status } from "../components/status";
import type { StatusValue } from "../components/status";
import { Category, Specimen } from "./specimen";

export const DISPLAY_NAMES = [
  "Badge",
  "Code tag",
  "Status",
  "Waiting label",
  "Avatar",
  "Kbd",
  "Stat strip",
  "Data list",
  "Relative time",
] as const;

const ALL_STATUSES = (Object.keys(STATUS_RANK) as StatusValue[]).toSorted(
  (a, b) => STATUS_RANK[b] - STATUS_RANK[a],
);

export const Display = () => (
  <Category
    id="display"
    lede="Small labels that sit inside rows. A kind is a cold tint after a name, a state is spelled out, and warmth turns up only when something is going wrong."
    title="Display"
  >
    <Specimen
      description="A kind comes after the name it qualifies. A grey badge is a plain category, amber is trouble that is still running, and the ghost one counts what was left out."
      name="Badge"
      wide
    >
      <div className="fj-hstack" data-wrap="">
        {KINDS.map((kind) => (
          <Badge key={kind} kind={kind} />
        ))}
      </div>
      <div className="fj-hstack" data-wrap="">
        <Badge>Read only</Badge>
        <Badge trouble="warn">Over budget</Badge>
        <Badge>Burned</Badge>
        <Badge variant="ghost">+3</Badge>
      </div>
    </Specimen>
    <Specimen
      description="Anything you would paste: an id, a method, a status code, a path. A 503 stays ink, because the row it sits in says whether that is bad."
      name="Code tag"
    >
      <div className="fj-hstack" data-wrap="">
        <CodeTag>POST</CodeTag>
        <CodeTag>/hooks/deploy</CodeTag>
        <CodeTag>503</CodeTag>
        <CodeTag>kd_prod_••••7c2e</CodeTag>
      </div>
    </Specimen>
    <Specimen
      description="Seven states in the order a list sorts them, worst first, so a failed job is never under a finished one."
      name="Status"
    >
      <ul className="fj-status-list">
        {ALL_STATUSES.map((status) => (
          <li key={status}>
            <code className="fj-t-code-sm fj-c-3">{status}</code>
            <Status status={status} />
          </li>
        ))}
      </ul>
    </Specimen>
    <Specimen
      description="Work held until a person acts, on a flat cold grey with no edge, so nobody mistakes it for a button. Past the first, a panel shows a count."
      name="Waiting label"
    >
      <div className="fj-hstack" data-wrap="">
        <InkSlot>Your call</InkSlot>
        <InkSlot>2 more held</InkSlot>
        <InkSlot size="sm">Second signature</InkSlot>
      </div>
    </Specimen>
    <Specimen
      description="A circle is a person and a 4px square is an agent in its teal tint, so every row shows whether a human or a model acted."
      name="Avatar"
    >
      <div className="fj-hstack" data-gap="12" data-wrap="">
        <span className="fj-hstack">
          <Avatar name="Sunniva Brekke" size="lg" />
          <span className="fj-t-label">Sunniva Brekke</span>
        </span>
        <span className="fj-hstack">
          <Avatar name="warden" size="lg" type="agent" />
          <span className="fj-t-label">warden</span>
        </span>
        <AvatarGroup
          label="Reviewers on storefront: Maren Holt, Idris Okafor and Tomasz Wierzba"
          names={["Maren Holt", "Idris Okafor", "Tomasz Wierzba"]}
        />
      </div>
    </Specimen>
    <Specimen description="A key on paper with a firmer bottom edge, in the sans." name="Kbd">
      <p className="fj-hstack fj-t-body-sm fj-c-2" data-wrap="">
        Open the palette with <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>, search runs with <Kbd>/</Kbd>
      </p>
    </Specimen>
    <Specimen
      bare
      description="Related figures side by side in one frame, parted by rules. The numerals are Inter Display at 330, with tabular digits."
      name="Stat strip"
      wide
    >
      <StatStrip
        label="storefront this week"
        stats={[
          { delta: "38 by agents", label: "Pull requests opened", value: "41" },
          { delta: "after a person signed", label: "Merged", value: "33" },
          { delta: "for a signature", label: "Median wait", unit: "min", value: "18" },
        ]}
      />
    </Specimen>
    <Specimen
      description="Read-only facts, term and value, split by row rules. A missing value says None."
      name="Data list"
    >
      <DataList
        entries={[
          { term: "Workspace", value: <CodeTag>ws_kestrel</CodeTag> },
          { term: "Region", value: "eu-north" },
          { term: "Owner", value: "Maren Holt" },
          { term: "Webhook", value: <span className="fj-c-3">None</span> },
        ]}
      />
    </Specimen>
    <Specimen
      description="Keeps itself current from the moment the page opened, in tabular figures."
      name="Relative time"
    >
      <ul className="fj-status-list">
        <li>
          <span className="fj-t-label">Last deploy</span>
          <RelativeTime secondsAgo={20} />
        </li>
        <li>
          <span className="fj-t-label">Key used</span>
          <RelativeTime secondsAgo={2640} />
        </li>
        <li>
          <span className="fj-t-label">Created</span>
          <RelativeTime secondsAgo={1_036_800} />
        </li>
      </ul>
    </Specimen>
  </Category>
);
