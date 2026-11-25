import { CodeTag } from "../components/badge";
import { Foundation, Rules, Stage } from "./section";

const ROLES = [
  {
    className: "fj-t-display",
    family: "Inter Display",
    metrics: "46/50",
    role: "display",
    sample: "Fog, paper, ink",
    tracking: "-0.022em",
    use: "The product's name, once",
    weight: "330",
  },
  {
    className: "fj-t-title",
    family: "Inter Display",
    metrics: "30/36",
    role: "title",
    sample: "Move patchwright to tern-4",
    tracking: "-0.022em",
    use: "A page that is one decision",
    weight: "360",
  },
  {
    className: "fj-t-heading",
    family: "Inter",
    metrics: "21/28",
    role: "heading",
    sample: "Coupon total read too early",
    tracking: "-0.012em",
    use: "The object a screen is about",
    weight: "420",
  },
  {
    className: "fj-t-subheading",
    family: "Inter",
    metrics: "16/24",
    role: "subheading",
    sample: "Shadow window",
    tracking: "-0.012em",
    use: "Card and dialog titles",
    weight: "460",
  },
  {
    className: "fj-t-body-lg",
    family: "Inter",
    metrics: "16/26",
    role: "body-lg",
    sample: "A swap nobody signs closes on the old model.",
    tracking: "-0.004em",
    use: "Ledes over a whole section",
    weight: "360",
  },
  {
    className: "fj-t-body",
    family: "Inter",
    metrics: "14/21",
    role: "body",
    sample: "warden wants to rewrite two commits on release/2.8.",
    tracking: "0",
    use: "Sentences inside the product",
    weight: "360",
  },
  {
    className: "fj-t-body-sm",
    family: "Inter",
    metrics: "13/18",
    role: "body-sm",
    sample: "3 ahead, 14 behind, pushed 55 min ago",
    tracking: "0",
    use: "The line under a row's title",
    weight: "400",
  },
  {
    className: "fj-t-label",
    family: "Inter",
    metrics: "14/18",
    role: "label",
    sample: "Sign and swap",
    tracking: "0",
    use: "Buttons, cells, status words",
    weight: "460",
  },
  {
    className: "fj-t-label-sm",
    family: "Inter",
    metrics: "12/16",
    role: "label-sm",
    sample: "Behind",
    tracking: "0",
    use: "Column heads and units",
    weight: "460",
  },
  {
    className: "fj-t-code",
    family: "JetBrains Mono",
    metrics: "13/20",
    role: "code",
    sample: "await lookupCoupon(code)",
    tracking: "0",
    use: "Source, terminal lines, a new key",
    weight: "400",
  },
  {
    className: "fj-t-code-sm",
    family: "JetBrains Mono",
    metrics: "12/16",
    role: "code-sm",
    sample: "agent/coupon-race",
    tracking: "0",
    use: "Branches and run ids in a row",
    weight: "400",
  },
  {
    className: "fj-t-stat",
    family: "Inter Display",
    metrics: "32/36",
    role: "stat",
    sample: "36",
    tracking: "-0.012em",
    use: "The number a panel exists for",
    weight: "330",
  },
] as const;

const WIDE = ["111.1s", "888.8s", "101.7s", "444.4s"];

export const TypeFoundation = () => (
  <Foundation
    id="typography"
    lede="Inter does the reading. Its Display cut takes over at 30px and up, and JetBrains Mono is saved for strings someone will paste into a terminal. A heading outranks the text under it by being larger and lighter, never bolder: 460 is the heaviest weight in the scale, and paragraphs are set at 360."
    title="Typography"
  >
    <div className="fj-card">
      <div className="fj-scroll-x">
        <table className="fj-table fj-type-table">
          <caption className="fj-sr">Type roles</caption>
          <thead>
            <tr>
              <th scope="col">Role</th>
              <th scope="col">Face</th>
              <th data-num="" scope="col">
                Size/line
              </th>
              <th data-num="" scope="col">
                Weight
              </th>
              <th data-num="" scope="col">
                Tracking
              </th>
              <th scope="col">Sample</th>
            </tr>
          </thead>
          <tbody>
            {ROLES.map((role) => (
              <tr key={role.role}>
                <th scope="row">
                  <code className="fj-t-code-sm">{role.role}</code>
                  <span className="fj-type-use">{role.use}</span>
                </th>
                <td className="fj-c-2">{role.family}</td>
                <td className="fj-c-2" data-num="">
                  {role.metrics}
                </td>
                <td className="fj-c-2" data-num="">
                  {role.weight}
                </td>
                <td className="fj-c-2" data-num="">
                  {role.tracking}
                </td>
                <td className={`fj-type-sample ${role.className}`}>{role.sample}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div className="fj-two">
      <Stage>
        <p className="fj-t-label">Ones are narrow, eights are not</p>
        <div className="fj-figures">
          <div>
            <span className="fj-t-label-sm fj-c-3">Proportional</span>
            {WIDE.map((value) => (
              <span className="fj-figure" data-proportional="" key={value}>
                {value}
              </span>
            ))}
          </div>
          <div>
            <span className="fj-t-label-sm fj-c-3">Tabular, as Fjord sets them</span>
            {WIDE.map((value) => (
              <span className="fj-figure fj-data" key={value}>
                {value}
              </span>
            ))}
          </div>
        </div>
        <p className="fj-t-body-sm fj-c-2">
          Left-aligned on purpose: with proportional figures the ones pull in and the eights push
          out, so the unit wanders. Tabular figures give every digit one width.
        </p>
      </Stage>
      <Stage>
        <p className="fj-t-label">What only Inter gives</p>
        <div className="fj-vstack" data-gap="12">
          <p className="fj-t-body fj-data fj-il1">I l 1 0 O</p>
          <p className="fj-t-body-sm fj-c-2">
            The slashed zero and the capital I with serifs are Inter features (zero and cv08). Where
            Inter is missing the platform sans takes over, figures stay tabular, and the I and the l
            may look alike again.
          </p>
          <p className="fj-hstack fj-t-body" data-wrap="">
            <CodeTag>kr-2817-3</CodeTag>
            <span>ran for</span>
            <span className="fj-data fj-strong">7.06s</span>
          </p>
          <p className="fj-t-body-sm fj-c-2">
            The run id goes in mono because it gets pasted. The duration is read, so it stays in
            Inter.
          </p>
        </div>
      </Stage>
    </div>

    <Rules
      items={[
        {
          id: "rank-by-size",
          text: "To raise a heading, take the next size up. Weight tops out at 460, so a bold word inside a row can never outrank the screen's heading.",
        },
        {
          id: "display-cut-above-30",
          text: "Inter Display starts at 30px and stops there. Below 30px its tighter spacing turns words into blocks.",
        },
        {
          id: "lower-case-labels",
          text: "Sentence case on every label, button and column head. Fjord has no all-caps text and no letterspaced captions.",
        },
        {
          id: "digits-one-width",
          text: "Counts, clocks and sizes carry tabular figures and the slashed zero, so a column lines up without dropping to mono.",
        },
        {
          id: "prose-floor",
          text: "A full sentence is body-sm or larger in text-2. label-sm in text-3 carries one or two words and never a sentence.",
        },
      ]}
    />
  </Foundation>
);
