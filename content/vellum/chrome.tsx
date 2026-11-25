import type { ReactNode } from "react";

/** One of the page's three parts: In use, Foundations, Components. */
export const Part = ({
  id,
  title,
  lede,
  children,
}: {
  id: string;
  title: string;
  lede: string;
  children: ReactNode;
}) => (
  <section aria-labelledby={`${id}-title`} className="v-part" id={id}>
    <header className="v-part-head">
      <h2 className="v-title" id={`${id}-title`}>
        {title}
      </h2>
      <p>{lede}</p>
    </header>
    {children}
  </section>
);

/** A section inside a part, under a hairline. */
export const Sub = ({
  id,
  title,
  note,
  action,
  children,
}: {
  id: string;
  title: string;
  note?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <section aria-labelledby={`${id}-title`} className="v-sub" id={id}>
    <div className="v-sub-head">
      <div className="v-stack-sm v-gap-2">
        <h3 className="v-heading" id={`${id}-title`}>
          {title}
        </h3>
        {note ? <p>{note}</p> : null}
      </div>
      {action}
    </div>
    {children}
  </section>
);

/** A small heading inside a section. */
export const Minor = ({ children }: { children: ReactNode }) => (
  <h4 className="v-heading-sm v-minor">{children}</h4>
);

/** A live specimen: the page step with the component on it, its name and variant under it. */
export const Specimen = ({
  name,
  note,
  span,
  children,
}: {
  name: string;
  note?: string;
  span?: 2;
  children: ReactNode;
}) => (
  <figure className="v-specimen" data-span={span}>
    <div className="v-stage">{children}</div>
    <figcaption className="v-specimen-cap">
      {name}
      {note ? <span>{note}</span> : null}
    </figcaption>
  </figure>
);
