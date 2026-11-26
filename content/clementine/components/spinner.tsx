import "./spinner.css";

export const Spinner = ({ label }: { label?: string }) => (
  <span
    aria-hidden={label !== undefined && label !== "" ? undefined : true}
    aria-label={label}
    className="cl-spinner"
    role={label !== undefined && label !== "" ? "status" : undefined}
  />
);
