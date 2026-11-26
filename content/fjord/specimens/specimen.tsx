import type { ReactNode } from "react";

interface CategoryProps {
  id: string;
  title: string;
  lede: string;
  children: ReactNode;
}

export const Category = ({ id, title, lede, children }: CategoryProps) => (
  <section aria-labelledby={`${id}-title`} className="fj-cat" id={id}>
    <header className="fj-cat-head">
      <h3 className="fj-t-subheading" id={`${id}-title`}>
        {title}
      </h3>
      <p className="fj-t-body-sm fj-c-2">{lede}</p>
    </header>
    <div className="fj-spec-grid">{children}</div>
  </section>
);

interface SpecimenProps {
  name: string;
  description: string;
  wide?: boolean;
  bare?: boolean;
  children: ReactNode;
}

/** One live component with its name and a line on what it does. A component that brings its own frame sits bare on the fog; anything else gets a paper stage. */
export const Specimen = ({ name, description, wide, bare, children }: SpecimenProps) => (
  <article className="fj-spec" data-wide={wide === true ? "" : undefined}>
    <header className="fj-spec-head">
      <h4 className="fj-t-label">{name}</h4>
      <p className="fj-t-body-sm fj-c-2">{description}</p>
    </header>
    {bare === true ? children : <div className="fj-spec-stage">{children}</div>}
  </article>
);
