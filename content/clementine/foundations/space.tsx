import { Button } from "../components/button";
import { ALL_LIVE_TOKENS, ELEVATION, RADII, SPACE_STEPS, SPACE_USES } from "../data/tokens";
import { useLiveTokens } from "../lib/live-tokens";
import { Block } from "../shell";

import "./space.css";

export const SpaceFoundation = () => (
  <Block
    id="spacing"
    lead="Everything sits on a 4px grid. Related things are 4 to 8px apart; separate groups get 24px or more before anyone reaches for a line."
    title="Spacing"
  >
    <div className="cl-two">
      <ul className="cl-space">
        {SPACE_STEPS.map((step) => (
          <li key={step}>
            <span className="cl-mono">{step}</span>
            <span aria-hidden className="cl-space__bar" style={{ width: step * 3 }} />
          </li>
        ))}
      </ul>
      <div className="cl-stack">
        <div className="cl-heights">
          <div>
            <Button size="sm" variant="secondary">
              Skip
            </Button>
            <span className="cl-mono">36 sm</span>
          </div>
          <div>
            <Button variant="secondary">Request</Button>
            <span className="cl-mono">44 md</span>
          </div>
          <div>
            <Button size="lg" variant="solid">
              Lock card
            </Button>
            <span className="cl-mono">52 lg</span>
          </div>
        </div>
        <dl className="cl-uses">
          {SPACE_USES.map((item) => (
            <div key={item.gap}>
              <dt>{item.gap}</dt>
              <dd>{item.use}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  </Block>
);

const RadiusSample = ({ name }: { name: string }) => {
  if (name === "--radius-control") {
    return (
      <Button size="sm" variant="solid">
        Pay
      </Button>
    );
  }

  if (name === "--radius-pill") {
    return <span className="cl-rad-pill">Dining</span>;
  }

  if (name === "--radius-md") {
    return (
      <span className="cl-rad-menu">
        <span>Lock card</span>
        <span>Report it</span>
      </span>
    );
  }

  if (name === "--radius-sm") {
    return <span className="cl-rad-check" />;
  }

  return <span className="cl-rad-box" style={{ borderRadius: `var(${name})` }} />;
};

export const RadiusFoundation = () => {
  const tokens = useLiveTokens(ALL_LIVE_TOKENS);

  return (
    <Block
      id="radius"
      lead="Two shapes do most of the work. Things you press are soft squares at 14px; things that only label or slide are fully round. Panels open up to 20px and sheets to 28px, and a corner inside another is always the smaller one."
      title="Radius"
    >
      <ul className="cl-radii">
        {RADII.map((item) => (
          <li key={item.name}>
            <span className="cl-radii__stage">
              <RadiusSample name={item.name} />
            </span>
            <span className="cl-radii__name">
              <span className="cl-mono">{item.name.slice(2)}</span>
              <span>{tokens?.light.get(item.name) ?? "…"}</span>
            </span>
            <span className="cl-note">{item.role}</span>
          </li>
        ))}
      </ul>
    </Block>
  );
};

export const ElevationFoundation = () => (
  <Block
    id="elevation"
    lead="Most things lie flat on paper steps. Only what you can lift or dismiss casts a shadow: short and tight close to the page, wider and softer the higher it floats."
    title="Elevation"
  >
    <ol className="cl-levels">
      {ELEVATION.map((item, index) => (
        <li key={item.level}>
          <span className="cl-levels__stage">
            <span className="cl-levels__card" data-level={index}>
              {item.level}
            </span>
          </span>
          <span className="cl-mono">{item.token.slice(2)}</span>
          <span className="cl-note">{item.note}</span>
        </li>
      ))}
    </ol>
  </Block>
);
