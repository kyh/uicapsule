import React from "react";
import { classNames } from "utilities/helpers";
import { useFormControl } from "components/FormControl";
import useElementId from "hooks/useElementId";
import type * as T from "./Switch.types";
import s from "./Switch.module.css";

const Switch = (props: T.Props) => {
  const { name, checked, defaultChecked, onChange, className, attributes } =
    props;
  const rootClassNames = classNames(s.root, className);
  const formControl = useFormControl();
  const id = useElementId(
    formControl?.attributes.id ||
      props.id ||
      (props.inputAttributes?.id as string | undefined)
  );
  const inputAttributes = {
    ...props.inputAttributes,
    ...formControl?.attributes,
  };
  const disabled = formControl?.disabled || props.disabled;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChange) return;
    onChange({
      name,
      event,
      checked: event.target.checked,
    });
  };

  return (
    <label {...attributes} className={rootClassNames}>
      <input
        type="checkbox"
        {...inputAttributes}
        className={s.input}
        name={name}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={handleChange}
        id={id}
      />
      <span className={s.area} aria-hidden="true">
        <span className={s.thumb} />
      </span>
    </label>
  );
};

export default Switch;
