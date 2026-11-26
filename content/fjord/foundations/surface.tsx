import { Status } from "../components/status";
import { Foundation, Rules, Stage } from "./section";

const LINES = [
  {
    light: "0.855",
    token: "--fj-line-frame",
    use: "The edge of a card, a panel or an overlay, and nothing inside them",
  },
  {
    light: "0.915",
    token: "--fj-line-row",
    use: "Parts one row from the next; the final row has none",
  },
  { light: "0.78", token: "--fj-line-field", use: "Fields, secondary buttons, the code tag" },
  {
    light: "0.6",
    token: "--fj-line-control",
    use: "Unticked boxes, switch tracks and trace brackets, over 3:1 on paper",
  },
  {
    light: "0.52",
    token: "--fj-focus",
    use: "The glacier ring, 2px and offset, on whatever has the keyboard",
  },
] as const;

export const BordersFoundation = () => (
  <Foundation
    id="borders"
    lede="Fjord draws a line where one thing ends, a lighter one where a row ends, and a darker one where you can act. A panel holds one decision and greys its head and foot; a card holds a working list and stays paper all the way down."
    title="Borders and lines"
  >
    <div className="fj-card">
      <ul className="fj-rows">
        {LINES.map((line) => (
          <li className="fj-line-spec" key={line.token}>
            <span
              aria-hidden
              className="fj-line-sample"
              style={{ background: `var(${line.token})` }}
            />
            <code className="fj-t-code-sm">{line.token}</code>
            <span className="fj-data fj-c-2">L {line.light}</span>
            <span className="fj-t-body-sm fj-c-2">{line.use}</span>
          </li>
        ))}
      </ul>
    </div>
    <div className="fj-two">
      <figure className="fj-exhibit">
        <figcaption className="fj-t-label">Panel, for one decision</figcaption>
        <div className="fj-panel">
          <div className="fj-panel-head">
            <span className="fj-panel-title">Force-push release/2.8</span>
            <span className="fj-panel-meta">warden</span>
          </div>
          <div className="fj-panel-body fj-rows">
            <div className="fj-item" data-size="sm">
              <span className="fj-grow fj-t-label">Commits rewritten</span>
              <span className="fj-data">2</span>
            </div>
            <div className="fj-item" data-size="sm">
              <span className="fj-grow fj-t-label">Pulled since</span>
              <Status status="ok">Nobody</Status>
            </div>
          </div>
          <div className="fj-panel-foot">
            <p>The grey foot is where the answer goes</p>
          </div>
        </div>
      </figure>
      <figure className="fj-exhibit">
        <figcaption className="fj-t-label">Card, for a working list</figcaption>
        <div className="fj-card">
          <div className="fj-card-head">
            <span className="fj-card-title">Next in line</span>
            <span className="fj-card-meta">2 of 4</span>
          </div>
          <div className="fj-rows">
            <div className="fj-item" data-size="sm">
              <code className="fj-code-tag">kr-2831-1</code>
              <span className="fj-grow fj-t-label fj-truncate">Drop the legacy-tax flag</span>
              <Status status="queued" />
            </div>
            <div className="fj-item" data-size="sm">
              <code className="fj-code-tag">kr-2832-2</code>
              <span className="fj-grow fj-t-label fj-truncate">Cache tax table lookups</span>
              <Status status="queued" />
            </div>
          </div>
        </div>
      </figure>
    </div>
    <Rules
      items={[
        {
          id: "edge-once",
          text: "A frame is drawn once, around the outside. Inside it, groups part with row rules or sit in the well, and never in a second bordered box.",
        },
        {
          id: "operable-has-an-edge",
          text: "If you can press it or type in it, it shows an edge before the pointer arrives. A row rule is never the only thing marking a control.",
        },
        {
          id: "picked-is-a-wash",
          text: "A picked row is the cold wash across its full width. A colored stripe at its start would read as a status, not a choice.",
        },
      ]}
    />
  </Foundation>
);

export const ElevationFoundation = () => (
  <Foundation
    id="elevation"
    lede="Fjord has three heights. Cards and tables lie on the fog, buttons and fields stand a hairline proud of it, and a menu, dialog or toast hangs above it on a long, soft shadow tinted blue."
    title="Elevation"
  >
    <Stage>
      <div className="fj-elev-grid">
        <div className="fj-vstack" data-gap="8">
          <div className="fj-elev-box" data-level="flow">
            Flow
          </div>
          <p className="fj-t-label">Flow</p>
          <p className="fj-t-body-sm fj-c-2">
            Paper edged by the frame line: cards, tables, panels.
          </p>
          <code className="fj-t-code-sm fj-c-3">--fj-line-frame</code>
        </div>
        <div className="fj-vstack" data-gap="8">
          <div className="fj-elev-box" data-level="flow">
            <div className="fj-elev-well">pnpm test coupon</div>
          </div>
          <p className="fj-t-label">Well</p>
          <p className="fj-t-body-sm fj-c-2">
            A sunken grey inside a frame, with no edge of its own, for output and secrets.
          </p>
          <code className="fj-t-code-sm fj-c-3">--fj-surface-well</code>
        </div>
        <div className="fj-vstack" data-gap="8">
          <div className="fj-elev-box" data-level="control">
            <span className="fj-btn" data-variant="secondary">
              Keep it open
            </span>
          </div>
          <p className="fj-t-label">Control</p>
          <p className="fj-t-body-sm fj-c-2">
            A one-pixel drop under its edge, so a button stands on the page.
          </p>
          <code className="fj-t-code-sm fj-c-3">--fj-elev-control</code>
        </div>
        <div className="fj-vstack" data-gap="8">
          <div className="fj-elev-box" data-level="overlay">
            Overlay
          </div>
          <p className="fj-t-label">Overlay</p>
          <p className="fj-t-body-sm fj-c-2">
            The frame line, a tight contact shadow and a long soft one.
          </p>
          <code className="fj-t-code-sm fj-c-3">--fj-elev-overlay</code>
        </div>
      </div>
    </Stage>
    <Rules
      items={[
        {
          id: "shadow-means-it-floats",
          text: "A shadow promises that the thing can be dismissed and the page is still under it. Cards cannot be dismissed, so they lie flat.",
        },
        {
          id: "shadow-from-the-token",
          text: "Components read --fj-elev-overlay and never write their own. The dark theme sets its own deeper copy of the same three layers.",
        },
        {
          id: "overlays-are-opaque",
          text: "Menus and dialogs are solid paper. Text over a frosted pane changes contrast with whatever scrolls behind it.",
        },
      ]}
    />
  </Foundation>
);
