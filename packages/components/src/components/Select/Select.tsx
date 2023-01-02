import React from "react";
import Icon from "components/Icon";
import { useFormControl } from "components/FormControl";
import IconArrow from "icons/ChevronDown";
import {
  classNames,
  responsiveClassNames,
  responsivePropDependency,
} from "utilities/helpers";
import useElementId from "hooks/useElementId";
import type * as T from "./Select.types";
import s from "./Select.module.css";

const Select = (props: T.Props) => {
  const {
    onChange,
    name,
    value,
    defaultValue,
    placeholder,
    options,
    icon,
    startSlot,
    size = "medium",
    className,
    attributes,
  } = props;
  const [empty, setEmpty] = React.useState(
    value === undefined ? !defaultValue : !value
  );
  const formControl = useFormControl();
  const id = useElementId(props.id);
  const inputId =
    formControl?.attributes?.id || props.inputAttributes?.id || id;
  const disabled = formControl?.disabled || props.disabled;
  const hasError = formControl?.hasError || props.hasError;
  const inputAttributes = {
    ...props.inputAttributes,
    ...formControl?.attributes,
  };
  const rootClassName = classNames(
    s.root,
    className,
    size && responsiveClassNames(s, "--size", size),
    hasError && s["--status-error"],
    disabled && s["--disabled"],
    empty && s["--placeholder"]
  );

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextValue = event.target.value;

    // Uncontrolled placeholder
    if (value === undefined) setEmpty(!nextValue);

    if (!onChange) return;
    onChange({ name, value: nextValue, event });
  };

  // Controlled placeholder
  React.useEffect(() => {
    if (value === undefined) return;
    setEmpty(!value);
  }, [value]);

  return (
    <div {...attributes} className={rootClassName}>
      {(startSlot || icon) && (
        <div className={s.slot}>
          {icon ? (
            <Icon
              size={responsivePropDependency(size, (size) => {
                if (size === "large") return 5;
                if (size === "xlarge") return 6;
                return 4;
              })}
              svg={icon}
            />
          ) : (
            startSlot
          )}
        </div>
      )}

      <select
        {...inputAttributes}
        className={s.input}
        disabled={disabled}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        id={inputId}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      <div className={s.icon}>
        <Icon
          svg={IconArrow}
          size={responsivePropDependency(size, (size) => {
            return size === "large" || size === "xlarge" ? 5 : 4;
          })}
        />
      </div>
    </div>
  );
};

export default Select;
