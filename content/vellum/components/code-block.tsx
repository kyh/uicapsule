import { CopyButton } from "./copy-button";

/** Copyable source or tool output set in 12px mono on paper. */
export const CodeBlock = ({ title, code }: { title: string; code: string }) => (
  <figure className="v-code-frame">
    <figcaption className="v-code-head">
      <span className="v-code-sm v-t2 v-truncate v-grow">{title}</span>
      <CopyButton label={`Copy ${title}`} value={code} />
    </figcaption>
    <pre className="v-code-body v-code-block">
      <code>{code}</code>
    </pre>
  </figure>
);
