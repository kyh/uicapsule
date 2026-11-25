import { CopyButton } from "@repo/ui/components/copy-button";

export const CodeSnippet = ({ text, label }: { text: string; label?: string }) => (
  <figure className="bg-muted/40 min-w-0 overflow-hidden rounded-lg border">
    <figcaption className="text-muted-foreground flex h-9 items-center justify-between border-b pr-1 pl-3 font-mono text-xs">
      {label}
      <CopyButton value={text} label={label ? `Copy ${label}` : "Copy"} size="icon-sm" />
    </figcaption>
    <pre className="text-foreground overflow-x-auto p-3 font-mono text-xs leading-relaxed">
      <code>{text}</code>
    </pre>
  </figure>
);
