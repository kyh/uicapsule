import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { CopyButton } from "./copy-button";
import { Frame, FrameHead } from "./frame";
import { Icon } from "./icon";

const TOKEN =
  /(?<com>--.*$)|(?<str>'[^']*')|(?<kw>\b(?:SELECT|FROM|WHERE|JOIN|ON|GROUP|BY|ORDER|MERGE|INTO|USING|WHEN|MATCHED|THEN|UPDATE|SET|INSERT|VALUES|AND|AS|NOT|COUNT|HAVING|DISTINCT|PARTITION|INTERVAL)\b)|(?<num>\b\d[\d_.]*\b)/gu;

const highlight = (line: string) => {
  const parts: ReactNode[] = [];
  let last = 0;

  for (const match of line.matchAll(TOKEN)) {
    const at = match.index;

    if (at > last) {
      parts.push(line.slice(last, at));
    }

    const kind =
      Object.entries(match.groups ?? {}).find(([, text]) => text !== undefined)?.[0] ?? "kw";

    parts.push(
      <span className={`hx-tok-${kind}`} key={`${at}-${kind}`}>
        {match[0]}
      </span>,
    );
    last = at + match[0].length;
  }

  if (last < line.length) {
    parts.push(line.slice(last));
  }

  return parts;
};

const NO_LINES: readonly number[] = [];

const lineTone = (line: number, failLine: number | undefined, washLines: readonly number[]) => {
  if (line === failLine) {
    return "fail";
  }

  return washLines.includes(line) ? "wash" : undefined;
};

interface CodeWindowProps {
  name: string;
  code: string;
  meta?: string;
  failLine?: number;
  washLines?: readonly number[];
  plain?: boolean;
  language?: "sql" | "text";
}

/** A titled SQL file with line numbers, light highlighting and an optional failing line. */
export const CodeWindow = ({
  name,
  code,
  meta,
  failLine,
  washLines = NO_LINES,
  plain,
  language = "sql",
}: CodeWindowProps) => {
  const lines = code.split("\n");

  return (
    <Frame label={name} plain={plain}>
      <FrameHead
        actions={<CopyButton label={`Copy ${name}`} value={code} />}
        meta={meta}
        title={name}
      />
      <pre
        className="hx-code-body"
        style={{ "--gutter": `${String(lines.length).length + 3}ch` } as CSSProperties}
      >
        <code>
          {lines.map((line, index) => (
            <span
              className="hx-code-line"
              data-tone={lineTone(index + 1, failLine, washLines)}
              key={`${index + 1}:${line}`}
            >
              <span>{index + 1}</span>
              <span>{language === "sql" ? highlight(line) : line || " "}</span>
            </span>
          ))}
        </code>
      </pre>
    </Frame>
  );
};

/** A JSON value already parsed into tagged nodes, so the view branches on its kind. */
export type Json =
  | { kind: "string"; value: string }
  | { kind: "number"; value: number }
  | { kind: "boolean"; value: boolean }
  | { kind: "null" }
  | { kind: "array"; items: Json[] }
  | { kind: "object"; entries: [string, Json][] };

/** Builders for a tagged JSON tree. */
export const json = {
  arr: (...items: Json[]) => ({ items, kind: "array" }) satisfies Json,
  bool: (value: boolean) => ({ kind: "boolean", value }) satisfies Json,
  nil: () => ({ kind: "null" }) satisfies Json,
  num: (value: number) => ({ kind: "number", value }) satisfies Json,
  obj: (record: Record<string, Json>) =>
    ({ entries: Object.entries(record), kind: "object" }) satisfies Json,
  str: (value: string) => ({ kind: "string", value }) satisfies Json,
};

const Scalar = ({ node }: { node: Json }) => {
  if (node.kind === "string") {
    return <span className="hx-json-str">&quot;{node.value}&quot;</span>;
  }

  if (node.kind === "number" || node.kind === "boolean") {
    return <span className="hx-json-num">{String(node.value)}</span>;
  }

  return <span className="hx-json-dim">null</span>;
};

const childrenOf = (node: Json) => {
  if (node.kind === "array") {
    return node.items.map((item, index) => [String(index), item] as const);
  }

  if (node.kind === "object") {
    return node.entries;
  }

  return null;
};

const JsonNode = ({ name, node, depth }: { name: string; node: Json; depth: number }) => {
  const [open, setOpen] = useState(depth < 2);
  const entries = childrenOf(node);

  if (!entries) {
    return (
      <li>
        <span className="hx-json-key">{name}</span>
        <span className="hx-json-dim">: </span>
        <Scalar node={node} />
      </li>
    );
  }

  const list = node.kind === "array";
  const [start, end] = list ? ["[", "]"] : ["{", "}"];

  return (
    <li>
      <button
        aria-expanded={open}
        className="hx-json-toggle"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <Icon icon={open ? ChevronDown : ChevronRight} size={14} />
        <span className="hx-json-key">{name}</span>
      </button>
      <span className="hx-json-dim">
        {": "}
        {start}
        {open
          ? ""
          : ` ${entries.length} ${list ? "item" : "key"}${entries.length === 1 ? "" : "s"} ${end}`}
      </span>
      {open ? (
        <>
          <ul>
            {entries.map(([key, child]) => (
              <JsonNode depth={depth + 1} key={key} name={key} node={child} />
            ))}
          </ul>
          <span className="hx-json-dim">{end}</span>
        </>
      ) : null}
    </li>
  );
};

/** A foldable tree view of a tagged JSON value. */
export const JsonView = ({ name, value }: { name: string; value: Json }) => (
  <ul className="hx-json">
    <JsonNode depth={0} name={name} node={value} />
  </ul>
);
