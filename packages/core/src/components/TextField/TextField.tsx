import React from "react";
import { classNames } from "utilities/helpers";
import useElementId from "hooks/useElementId";
import { useFormControl } from "components/FormControl";
import Icon from "components/Icon";
import type * as T from "./TextField.types";
import s from "./TextField.module.css";

const TextField = (props: T.Props) => {
	const {
		onChange,
		name,
		value,
		defaultValue,
		placeholder,
		className,
		attributes,
		startIcon,
		endIcon,
		startSlot,
		endSlot,
		icon,
		iconPosition = "start",
	} = props;
	const formControl = useFormControl();
	const id = useElementId(props.id);
	const inputId =
		formControl?.attributes.id || (props.inputAttributes?.id as string | undefined) || id;
	const disabled = formControl?.disabled || props.disabled;
	const hasError = formControl?.hasError || props.hasError;
	const inputAttributes = { ...props.inputAttributes, ...formControl?.attributes };
	const rootClassName = classNames(
		s.root,
		className,
		hasError && s["--status-error"],
		disabled && s["--disabled"]
	);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (!onChange) return;
		onChange({ name, value: event.target.value, event });
	};

	return (
		<div {...attributes} className={rootClassName}>
			{(startSlot || (icon && iconPosition === "start") || startIcon) && (
				<div className={s.slot}>
					{startIcon || icon ? <Icon size={4} svg={(startIcon || icon)!} /> : startSlot}
				</div>
			)}

			<input
				{...inputAttributes}
				disabled={disabled}
				id={inputId}
				name={name}
				className={s.input}
				placeholder={placeholder}
				value={value}
				defaultValue={defaultValue}
				onChange={handleChange}
			/>
			<div className={s.focus} />
			<div className={s.decorator} />

			{(endSlot || (icon && iconPosition === "end") || endIcon) && (
				<div className={s.slot}>
					{icon || endIcon ? <Icon size={4} svg={(icon || endIcon)!} /> : endSlot}
				</div>
			)}
		</div>
	);
};

export default TextField;
