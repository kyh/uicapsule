import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ChevronRight, Pause, Play } from "lucide-react";

import { useInterval } from "../lib/hooks";
import { Button } from "./button";
import { CopyButton } from "./copy-button";
import { Icon } from "./icon";
import { Segmented } from "./selection";

export type TokenType = "kw" | "str" | "com" | "fn" | "num" | "txt" | "prompt";

export type CodeLine = readonly (readonly [TokenType, string])[];

interface CodeBlockProps {
  title: string;
  lines: readonly CodeLine[];
  numbered?: boolean;
}

/** Code in the well. Ink does the highlighting: strings at 78%, comments at 64%, keywords one step heavier. */
export const CodeBlock = ({ title, lines, numbered = true }: CodeBlockProps) => {
  const text = lines
    .map((line) =>
      line
        .filter(([type]) => type !== "prompt")
        .map(([, value]) => value)
        .join(""),
    )
    .join("\n");

  return (
    <figure className="fj-code">
      <figcaption className="fj-code-head">
        <code className="fj-t-code-sm">{title}</code>
        <span className="fj-push">
          <CopyButton label={`Copy ${title}`} size="icon-xs" value={text} />
        </span>
      </figcaption>
      <pre className="fj-code-body fj-scroll-x" data-numbered={numbered ? "" : undefined}>
        <code>
          {lines.map((line, row) => (
            <span className="fj-code-line" key={`${title}-${row.toString()}`}>
              {line.map(([type, value], column) => (
                <span data-token={type} key={`${column.toString()}-${value}`}>
                  {value}
                </span>
              ))}
              {"\n"}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
};

export type JsonValue = string | number | boolean | null | readonly JsonValue[] | JsonObject;

export interface JsonObject {
  readonly [key: string]: JsonValue;
}

const isObject = (value: JsonValue): value is JsonObject =>
  value !== null && !Array.isArray(value) && typeof value === "object";

const isText = (value: JsonValue): value is string => typeof value === "string";

const isNumber = (value: JsonValue): value is number => typeof value === "number";

const isList = (value: JsonValue): value is readonly JsonValue[] => Array.isArray(value);

const entriesOf = (value: JsonValue) => {
  if (isList(value)) {
    return value.map<[string, JsonValue]>((item, index) => [String(index), item]);
  }

  if (isObject(value)) {
    return Object.entries<JsonValue>(value);
  }

  return [];
};

const Scalar = ({ value }: { value: JsonValue }) => {
  if (isText(value)) {
    return <span data-token="str">&quot;{value}&quot;</span>;
  }

  if (isNumber(value)) {
    return <span data-token="num">{value}</span>;
  }

  return <span data-token="kw">{JSON.stringify(value)}</span>;
};

const JsonNode = ({ name, value, depth }: { name?: string; value: JsonValue; depth: number }) => {
  const [open, setOpen] = useState(depth < 2);
  const branch = Array.isArray(value) || isObject(value);

  const entries = entriesOf(value);

  const brackets = Array.isArray(value) ? ["[", "]"] : ["{", "}"];
  const key = name === undefined ? null : <span data-token="key">{name}: </span>;

  if (!branch) {
    return (
      <li>
        {key}
        <Scalar value={value} />
      </li>
    );
  }

  return (
    <li>
      <button
        aria-expanded={open}
        className="fj-json-toggle"
        onClick={() => {
          setOpen((current) => !current);
        }}
        type="button"
      >
        <Icon icon={ChevronRight} size={12} />
        {key}
        <span data-token="com">
          {brackets[0]}
          {open
            ? ""
            : ` ${entries.length} ${entries.length === 1 ? "item" : "items"} ${brackets[1]}`}
        </span>
      </button>
      {open ? (
        <>
          <ul className="fj-json-children">
            {entries.map(([childName, child]) => (
              <JsonNode
                depth={depth + 1}
                key={childName}
                name={Array.isArray(value) ? undefined : childName}
                value={child}
              />
            ))}
          </ul>
          <span data-token="com">{brackets[1]}</span>
        </>
      ) : null}
    </li>
  );
};

/** A payload as a tree; branches open with a cut and say how many items they hold when shut. */
export const JsonView = ({ value, label }: { value: JsonValue; label: string }) => (
  <ul aria-label={label} className="fj-json fj-well">
    <JsonNode depth={0} value={value} />
  </ul>
);

export interface LogLine {
  time: string;
  level: "info" | "warn" | "fail";
  source: string;
  message: string;
}

const LEVEL_WORD = { fail: "Error", info: "Info", warn: "Warn" } as const;
const FILTERS = ["All", "Trouble"] as const;

interface LogViewerProps {
  initial: readonly LogLine[];
  stream: readonly LogLine[];
  header?: ReactNode;
}

/** A log that follows its tail inside its own box; Pause holds it, and trouble levels are words. */
export const LogViewer = ({ initial, stream, header }: LogViewerProps) => {
  const [lines, setLines] = useState<LogLine[]>([...initial]);
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const cursor = useRef(0);
  const box = useRef<HTMLDivElement>(null);

  useInterval(
    () => {
      const next = stream[cursor.current % stream.length];

      cursor.current += 1;

      if (next) {
        setLines((current) => [...current.slice(-80), next]);
      }
    },
    paused ? null : 1400,
  );

  useEffect(() => {
    const node = box.current;

    if (node && !paused) {
      node.scrollTop = node.scrollHeight;
    }
  });

  const shown = filter === "All" ? lines : lines.filter((line) => line.level !== "info");

  return (
    <div className="fj-log">
      <div className="fj-log-head">
        {header}
        <span className="fj-push fj-hstack">
          <Segmented
            label="Levels"
            onValueChange={setFilter}
            options={FILTERS}
            size="xs"
            value={filter}
          />
          <Button
            aria-pressed={paused}
            onClick={() => {
              setPaused((value) => !value);
            }}
            size="xs"
            variant="ghost"
          >
            <Icon icon={paused ? Play : Pause} size={12} />
            {paused ? "Follow" : "Pause"}
          </Button>
        </span>
      </div>
      <div aria-label="Log lines" aria-live="off" className="fj-log-body" ref={box} role="log">
        {shown.map((line, index) => (
          <div
            className="fj-log-line"
            data-level={line.level}
            key={`${line.time}-${index.toString()}`}
          >
            <span className="fj-data fj-log-time">{line.time}</span>
            <span className="fj-log-level">{LEVEL_WORD[line.level]}</span>
            <span className="fj-log-source">{line.source}</span>
            <span className="fj-log-msg">{line.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
