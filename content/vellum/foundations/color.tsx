"use client";

import { useState } from "react";

import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { Status } from "../components/status";
import { Minor } from "../chrome";
import { composite, contrast, formatRatio } from "../lib/color";
import { useTheme } from "../lib/settings";
import { COLOR_TOKENS, CONTRAST, GREYS, STATUS, SURFACES, TEXT } from "./tokens";
import type { ColorRole } from "./tokens";

type Values = Record<"light" | "dark", Record<string, string>>;

const read = (node: Element) => {
  const style = getComputedStyle(node);

  return Object.fromEntries(
    COLOR_TOKENS.map((token) => [token, style.getPropertyValue(`--${token}`).trim()]),
  );
};

const useTokenValues = () => {
  const [values, setValues] = useState<Values | null>(null);

  const measure = (node: HTMLDivElement | null) => {
    const light = node?.querySelector('[data-theme="light"]');
    const dark = node?.querySelector('[data-theme="dark"]');

    if (values || !light || !dark) {
      return;
    }

    setValues({ dark: read(dark), light: read(light) });
  };

  return [values, measure] as const;
};

const Value = ({ value, paper }: { value: string; paper: string }) => (
  <span className="v-token-value">
    <span
      aria-hidden
      className="v-token-chip"
      style={{ background: value ? composite(value, paper || "#fff") : undefined }}
    />
    <span className="v-swatch-value">{value || "…"}</span>
  </span>
);

const TokenTable = ({
  label,
  roles,
  values,
}: {
  label: string;
  roles: readonly ColorRole[];
  values: Values | null;
}) => {
  const theme = useTheme();

  return (
    <table className="v-spec-table v-token-table">
      <caption className="v-sr">{label}</caption>
      <thead>
        <tr>
          <th scope="col">Token</th>
          <th scope="col">Role</th>
          <th scope="col">Use for</th>
          <th scope="col">Not for</th>
          <th data-current={theme === "light" ? "" : undefined} scope="col">
            Light
          </th>
          <th data-current={theme === "dark" ? "" : undefined} scope="col">
            Dark
          </th>
        </tr>
      </thead>
      <tbody>
        {roles.map((item) => (
          <tr key={item.token}>
            <th className="v-code-sm" scope="row">
              --{item.token}
            </th>
            <td data-label="Role">{item.role}</td>
            <td className="v-t2" data-label="Use for">
              {item.use}
            </td>
            <td
              className="v-t2"
              data-empty={item.not !== undefined && item.not !== "" ? undefined : ""}
              data-label="Not for"
            >
              {item.not ?? "–"}
            </td>
            <td data-label="Light">
              <Value paper={values?.light.paper ?? ""} value={values?.light[item.token] ?? ""} />
            </td>
            <td data-label="Dark">
              <Value paper={values?.dark.paper ?? ""} value={values?.dark[item.token] ?? ""} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const ratioFor = (values: Record<string, string>, pair: (typeof CONTRAST)[number]) =>
  Math.min(
    ...pair.backgrounds.map((background) => {
      const ground = values[background] ?? "#fff";

      const flat =
        pair.over !== undefined && pair.over !== ""
          ? composite(ground, values[pair.over] ?? "#fff")
          : ground;

      return contrast(values[pair.foreground] ?? "#000", flat);
    }),
  );

const ContrastTable = ({ values }: { values: Values | null }) => {
  const theme = useTheme();

  return (
    <table className="v-spec-table">
      <caption className="v-sr">Contrast, read from the live tokens</caption>
      <thead>
        <tr>
          <th scope="col">Lowest pairing</th>
          <th className="v-num" scope="col">
            Floor
          </th>
          <th className="v-num" data-current={theme === "light" ? "" : undefined} scope="col">
            Light
          </th>
          <th className="v-num" data-current={theme === "dark" ? "" : undefined} scope="col">
            Dark
          </th>
        </tr>
      </thead>
      <tbody>
        {CONTRAST.map((pair) => (
          <tr key={pair.label}>
            <td>{pair.label}</td>
            <td className="v-num v-t2">{pair.needs}:1</td>
            {(["light", "dark"] as const).map((side) => {
              const ratio = values ? ratioFor(values[side], pair) : null;

              return (
                <td
                  className={`v-num ${ratio !== null && ratio < pair.needs ? "v-short" : ""}`}
                  key={side}
                >
                  {ratio === null ? "…" : formatRatio(ratio)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/** Surfaces, thinned inks, verdict hues and their measured contrast. */
export const ColorFoundation = () => {
  const [values, measure] = useTokenValues();

  return (
    <>
      <div aria-hidden className="v-probes" ref={measure}>
        <div className="ds-vellum" data-theme="light" />
        <div className="ds-vellum" data-theme="dark" />
      </div>
      <Minor>Ink and vellum</Minor>
      <TokenTable label="Surfaces" roles={SURFACES} values={values} />
      <Minor>Greys are ink at alphas</Minor>
      <p className="v-body-sm v-t2 v-measure">
        No grey has a hex of its own. Each is the same ink thinned to one of eight strengths, so a
        rule drawn on paper keeps its weight over the grey shell and flips cleanly into the dark
        theme.
      </p>
      <TokenTable label="Greys" roles={GREYS} values={values} />
      <Minor>Status, and nothing else</Minor>
      <TokenTable label="Status" roles={STATUS} values={values} />
      <Minor>Text</Minor>
      <TokenTable label="Text" roles={TEXT} values={values} />
      <div className="v-stage v-pad-20">
        <div className="v-panel v-stack-sm v-pad-16">
          <p className="v-label v-t1">Docs answerer · text-1</p>
          <p className="v-body-sm v-t2">Answers from the API reference and cites it · text-2</p>
          <p className="v-body-sm v-t3">Find a run by its ID · text-3, placeholder</p>
          <p className="v-body-sm v-disabled">Retired in v3 · text-disabled</p>
        </div>
      </div>
      <Minor>Where colour and glass may go</Minor>
      <div className="v-stage v-pad-20">
        <div className="v-panel v-cluster v-pad-16" inert>
          <Badge tone="ok">Graded</Badge>
          <Badge tone="warn">Flaky</Badge>
          <Badge tone="fail">Regressed</Badge>
          <Status status="waiting" />
          <span className="v-grow" />
          <Button size="sm" variant="secondary">
            Keep the agent
          </Button>
          <Button size="sm" variant="destructive">
            Delete agent
          </Button>
        </div>
      </div>
      <ul className="v-stack-sm v-body-sm v-bullets">
        <li>
          Verdigris, ochre and vermilion say done, careful and broken. A hue never stands for a
          brand, a link, a heading or a chart line, and it never appears without its word.
        </li>
        <li>
          Glass carries the accent, on the single control a group is waiting on: ink as a rule,
          vermilion when there is no way back, verdigris to accept what an agent put forward.
        </li>
        <li>Focus is drawn in ink: an input holding the caret never looks broken.</li>
      </ul>
      <Minor>Contrast</Minor>
      <p className="v-body-sm v-t2 v-measure">
        Every ratio here is computed in the browser from the tokens as they are set now, for both
        themes, with translucent ink laid over its ground first.
      </p>
      <div className="v-scroll-x">
        <ContrastTable values={values} />
      </div>
    </>
  );
};
