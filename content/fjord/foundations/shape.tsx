import { Avatar } from "../components/avatar";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { Foundation, Rules, Stage } from "./section";

const SPACE = [
  { px: 2, token: "0-5", use: "Lining a glyph up with a cap height" },
  { px: 4, token: "1", use: "Panel shell to its paper body" },
  { px: 8, token: "2", use: "Between two buttons, glyph to word" },
  { px: 12, token: "3", use: "Cell padding, the gap between panels" },
  { px: 16, token: "4", use: "Inside a card, the gutter on a phone" },
  { px: 20, token: "5", use: "Around a specimen" },
  { px: 24, token: "6", use: "The gutter on a desktop" },
  { px: 32, token: "8", use: "Between the blocks of one screen" },
  { px: 40, token: "10", use: "Height of a one-line row" },
  { px: 56, token: "14", use: "Height of a two-line row" },
  { px: 80, token: "20", use: "Between the parts of this page" },
] as const;

export const SpaceFoundation = () => (
  <Foundation
    id="space"
    lede="A 4px scale. Row height is fixed too, 40px with one line and 56px with two, so a list on the left and a table on the right keep the same rhythm."
    title="Space"
  >
    <div className="fj-card">
      <ul className="fj-space-list fj-rows">
        {SPACE.map((step) => (
          <li key={step.token}>
            <code className="fj-t-code-sm">--fj-space-{step.token}</code>
            <span className="fj-data fj-c-2">{step.px}px</span>
            <span aria-hidden className="fj-space-bar" style={{ width: step.px }} />
            <span className="fj-t-body-sm fj-c-2">{step.use}</span>
          </li>
        ))}
      </ul>
    </div>
    <Rules
      items={[
        {
          id: "steps-of-four",
          text: "Every gap is a step on the scale. The 2px step aligns glyphs and never separates blocks.",
        },
        {
          id: "even-inset",
          text: "A control tucked into a header keeps the same distance to the side as to the top, so a 28px button in a 40px header sits 6px from both.",
        },
        {
          id: "gap-before-rule",
          text: "Reach for a bigger gap before a new rule. Rules already mean rows, so a decorative one reads as a row that is missing.",
        },
      ]}
    />
  </Foundation>
);

export const RadiusFoundation = () => (
  <Foundation
    id="radius"
    lede="Each box gets its corner from its job: 4px inside, 6px on anything you operate, 10px on the outside of a component. Round belongs to people alone, so a glance tells a person's avatar from an agent's."
    title="Radius"
  >
    <div className="fj-radius-grid">
      <Stage>
        <div className="fj-radius-demo" data-r="inner" />
        <div className="fj-vstack" data-gap="4">
          <p className="fj-t-label">Inner, 4px</p>
          <p className="fj-t-body-sm fj-c-2">
            Things that sit inside something else: badges, code tags, the picked segment, a menu
            row.
          </p>
          <span className="fj-hstack">
            <Badge kind="run" />
            <code className="fj-code-tag">kr-2817-3</code>
          </span>
        </div>
      </Stage>
      <Stage>
        <div className="fj-radius-demo" data-r="control" />
        <div className="fj-vstack" data-gap="4">
          <p className="fj-t-label">Control, 6px</p>
          <p className="fj-t-body-sm fj-c-2">
            What a hand or a key works: buttons, inputs, the segmented track, switches, tooltips.
          </p>
          <span className="fj-hstack">
            <Button size="sm">Add 10 minutes</Button>
          </span>
        </div>
      </Stage>
      <Stage>
        <div className="fj-radius-demo" data-r="frame" />
        <div className="fj-vstack" data-gap="4">
          <p className="fj-t-label">Frame, 10px</p>
          <p className="fj-t-body-sm fj-c-2">
            The outside of a whole component: cards, panels, dialogs, menus, toasts, this page’s
            specimens.
          </p>
        </div>
      </Stage>
      <Stage>
        <div className="fj-radius-demo" data-r="person" />
        <div className="fj-vstack" data-gap="4">
          <p className="fj-t-label">Person, full</p>
          <p className="fj-t-body-sm fj-c-2">
            A person’s avatar and nothing else. An agent’s avatar keeps 4px and its kind tint.
          </p>
          <span className="fj-hstack">
            <Avatar name="Maren Holt" />
            <Avatar name="patchwright" type="agent" />
          </span>
        </div>
      </Stage>
    </div>
    <div className="fj-two">
      <Stage>
        <p className="fj-t-label">Corners that nest</p>
        <div className="fj-nest-demo" aria-hidden>
          <div className="fj-nest-real">
            <div className="fj-nest-outer">
              <div className="fj-nest-inner" />
            </div>
          </div>
          <div className="fj-nest-zoom">
            <div className="fj-nest-outer">
              <div className="fj-nest-inner" />
            </div>
          </div>
        </div>
        <p className="fj-t-body-sm fj-c-2">
          The segmented track at real size, then the same element at four times. Its 6px corner and
          2px padding leave a 4px corner for the segment inside.
        </p>
      </Stage>
      <Rules
        items={[
          {
            id: "corner-follows-job",
            text: "Choose a corner from what the box does. Fjord has three and a person's circle, and no fifth.",
          },
          {
            id: "circle-means-human",
            text: "A circle is a human being. Tags, chips, switches and progress ends never go round, so the circle keeps meaning one thing.",
          },
          {
            id: "inner-is-outer-minus-pad",
            text: "A box inside a box takes the outer corner minus the padding between them, so the two curves stay parallel.",
          },
        ]}
      />
    </div>
  </Foundation>
);
