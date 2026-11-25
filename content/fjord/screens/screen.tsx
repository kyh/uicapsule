import { useId } from "react";
import type { ReactNode } from "react";

import { Breadcrumb } from "../components/navigation";

interface ScreenProps {
  id: string;
  title: string;
  description: string;
  crumbs: string[];
  bar?: ReactNode;
  children: ReactNode;
}

export const Screen = ({ id, title, description, crumbs, bar, children }: ScreenProps) => {
  const headingId = useId();

  return (
    <article aria-labelledby={headingId} className="fj-screen" id={id}>
      <header className="fj-screen-intro">
        <h3 className="fj-t-subheading" id={headingId}>
          {title}
        </h3>
        <p className="fj-t-body fj-c-2">{description}</p>
      </header>
      <div className="fj-window">
        <div className="fj-window-bar">
          <Breadcrumb items={crumbs} />
          {bar ? <div className="fj-push fj-hstack">{bar}</div> : null}
        </div>
        <div className="fj-window-body">{children}</div>
      </div>
    </article>
  );
};

export const PageHeader = ({
  title,
  children,
  actions,
}: {
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) => (
  <div className="fj-pagehead">
    <div className="fj-vstack" data-gap="4">
      <h4 className="fj-t-heading">{title}</h4>
      {children ? (
        <div className="fj-hstack fj-t-body fj-c-2" data-gap="12" data-wrap="">
          {children}
        </div>
      ) : null}
    </div>
    {actions ? <div className="fj-pagehead-actions">{actions}</div> : null}
  </div>
);
