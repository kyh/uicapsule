import React from "react";
import { classNames } from "utilities/helpers";
import { useFormControl } from "components/FormControl";
import useElementId from "hooks/useElementId";
import type * as T from "./TextArea.types";
import s from "./TextArea.module.css";

const InputText = (props: T.Props) => {
	const { onChange, name, value, defaultValue, placeholder, className, attributes } = props;
	const formControl = useFormControl();
	const id = useElementId(props.id);
	const inputId =
		formControl?.attributes?.id || (props.inputAttributes?.id as string | undefined) || id;
	const disabled = formControl?.disabled || props.disabled;
	const hasError = formControl?.hasError || props.hasError;
	const inputAttributes = { ...props.inputAttributes, ...formControl?.attributes };
	const rootClassName = classNames(
		s.root,
		className,
		hasError && s["--status-error"],
		disabled && s["--disabled"]
	);

	const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		if (!onChange) return;
		onChange({ name, value: event.target.value, event });
	};

	return (
		<div {...attributes} className={rootClassName}>
			<textarea
				rows={3}
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
			<div className={s.decorator} />
		</div>
	);
};

export default InputText;
