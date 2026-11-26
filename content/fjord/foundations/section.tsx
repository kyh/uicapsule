import type { ReactNode } from "react";

interface FoundationProps {
  id: string;
  title: string;
  lede: string;
  children: ReactNode;
}

export const Foundation = ({ id, title, lede, children }: FoundationProps) => (
  <section aria-labelledby={`${id}-title`} className="fj-foundation" id={id}>
    <header className="fj-foundation-head">
      <h3 className="fj-t-heading" id={`${id}-title`}>
        {title}
      </h3>
      <p className="fj-t-body fj-c-2">{lede}</p>
    </header>
    {children}
  </section>
);

export const Rules = ({ items }: { items: { id: string; text: ReactNode }[] }) => (
  <ol className="fj-rules">
    {items.map((item) => (
      <li key={item.id}>
        <code className="fj-t-code-sm fj-c-3">{item.id}</code>
        <p className="fj-t-body">{item.text}</p>
      </li>
    ))}
  </ol>
);

export const Stage = ({ children }: { children: ReactNode }) => (
  <div className="fj-stage">{children}</div>
);
