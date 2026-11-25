import { ArrowDownToLine, SkipForward, WrapText, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import { Button } from "./button";
import { Segmented } from "./choice";
import { CopyButton } from "./copy-button";
import { Frame, FrameHead } from "./frame";
import { Icon } from "./icon";
import { Input } from "./field";
import { Pending } from "./pending";

export type LogLevel = "debug" | "info" | "warn" | "fail";

export interface LogLine {
  id: number;
  time: string;
  level: LogLevel;
  source: string;
  message: string;
}

const LEVELS = ["All", "Warn", "Fail"] as const;

type LevelFilter = (typeof LEVELS)[number];

const matchesLevel = (line: LogLine, filter: LevelFilter) => {
  if (filter === "Fail") {
    return line.level === "fail";
  }

  if (filter === "Warn") {
    return line.level === "warn" || line.level === "fail";
  }

  return true;
};

const marked = (text: string, needle: string) => {
  if (!needle) {
    return text;
  }

  const at = text.toLowerCase().indexOf(needle.toLowerCase());

  if (at === -1) {
    return text;
  }

  return (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, at + needle.length)}</mark>
      {text.slice(at + needle.length)}
    </>
  );
};

interface LogViewerProps {
  name: string;
  lines: LogLine[];
  streaming?: boolean;
  toolbar?: boolean;
  height?: number;
  plain?: boolean;
}

/** Streams a run's output with level filters, search, wrap and follow. Severity sits in its own column and the red band. */
export const LogViewer = ({
  name,
  lines,
  streaming,
  toolbar,
  height = 280,
  plain,
}: LogViewerProps) => {
  const [filter, setFilter] = useState<LevelFilter>("All");
  const [query, setQuery] = useState("");
  const [wrap, setWrap] = useState(false);
  const [current, setCurrent] = useState<number | null>(null);
  const [follow, setFollow] = useState(true);
  const list = useRef<HTMLOListElement>(null);

  const shown = lines.filter(
    (line) =>
      matchesLevel(line, filter) &&
      (!query || line.message.toLowerCase().includes(query.toLowerCase())),
  );

  const failures = lines.filter((line) => line.level === "fail");
  const warnings = lines.filter((line) => line.level === "warn").length;

  useEffect(() => {
    const node = list.current;

    if (node && follow && lines.length > 0) {
      node.scrollTop = node.scrollHeight;
    }
  }, [lines.length, follow]);

  const nextFailure = () => {
    if (failures.length === 0) {
      return;
    }

    const after = failures.find((line) => current === null || line.id > current) ?? failures[0];

    if (!after) {
      return;
    }

    setFilter("All");
    setQuery("");
    setFollow(false);
    setCurrent(after.id);
    requestAnimationFrame(() => {
      list.current?.querySelector(`[data-id="${after.id}"]`)?.scrollIntoView({ block: "center" });
    });
  };

  return (
    <Frame label={`Log for ${name}`} plain={plain}>
      <FrameHead
        actions={
          <>
            <Button
              aria-label={wrap ? "Do not wrap lines" : "Wrap lines"}
              aria-pressed={wrap}
              onClick={() => setWrap(!wrap)}
              size="icon-sm"
              title="Wrap lines"
              variant="ghost"
            >
              <Icon icon={WrapText} />
            </Button>
            <Button
              aria-label="Next failure"
              disabled={failures.length === 0}
              onClick={nextFailure}
              size="icon-sm"
              title="Next failure"
              variant="ghost"
            >
              <Icon icon={SkipForward} />
            </Button>
            <Button
              aria-label="Follow output"
              aria-pressed={follow}
              onClick={() => setFollow(!follow)}
              size="icon-sm"
              title="Follow output"
              variant="ghost"
            >
              <Icon icon={ArrowDownToLine} />
            </Button>
            <CopyButton
              label="Copy log"
              value={lines
                .map(
                  (line) =>
                    `${line.time} ${line.level.toUpperCase()} ${line.source} ${line.message}`,
                )
                .join("\n")}
            />
          </>
        }
        meta={`${lines.length} lines · ${warnings} warn · ${failures.length} fail`}
        status={streaming ? <Pending label="Streaming" /> : null}
        title={name}
      />
      {toolbar ? (
        <div className="hx-toolbar">
          <div className="hx-log-search">
            <Input
              aria-label="Search the log"
              fieldSize="sm"
              lead={<Icon icon={Search} size={14} />}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search messages"
              value={query}
            />
          </div>
          <Segmented label="Level" onValueChange={setFilter} options={LEVELS} value={filter} />
          <span className="hx-code-sm hx-ink-3 hx-end">
            {shown.length} of {lines.length}
          </span>
        </div>
      ) : null}
      <ol
        aria-label={`${name} output`}
        className="hx-log"
        data-wrap={wrap}
        onWheel={() => setFollow(false)}
        ref={list}
        style={{ "--log-h": `${height}px` } as CSSProperties}
      >
        {shown.map((line) => (
          <li
            className="hx-log-line"
            data-current={line.id === current}
            data-id={line.id}
            data-level={line.level}
            key={line.id}
          >
            <span>{line.time}</span>
            <span className="hx-log-level" data-level={line.level}>
              {line.level}
            </span>
            <span className="hx-truncate">{line.source}</span>
            <span className="hx-log-msg" title={line.message}>
              {marked(line.message, query)}
            </span>
          </li>
        ))}
        {shown.length === 0 ? (
          <li className="hx-body-sm hx-ink-3 hx-log-empty">
            No lines match. Clear the search or show all levels.
          </li>
        ) : null}
      </ol>
    </Frame>
  );
};
