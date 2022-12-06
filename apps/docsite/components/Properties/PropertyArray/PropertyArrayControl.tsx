import React from "react";
import { View, Button, Popover, MenuItem } from "reshaped";
import PropertyBaseControl from "../PropertyBase/PropertyBaseControl";
import PropertiesControl from "../PropertiesControl";
import IconMinus from "icons/Minus";
import IconPlus from "icons/Plus";
import * as T from "../Properties.types";

const PropertyArrayItemControl = (props: T.ArrayItemControlProps) => {
	const { item, value, index, onRemove, onChange } = props;

	return (
		<View direction="row" gap={1}>
			<View.Item grow>
				{item.type === T.ControlType.object ? (
					<Popover position="bottom-end">
						<Popover.Trigger>
							{(attributes) => (
								<MenuItem size="small" attributes={attributes} roundedCorners>
									Item {index + 1}
								</MenuItem>
							)}
						</Popover.Trigger>
						<Popover.Content>
							<View gap={2}>
								{item.properties &&
									Object.entries(item.properties).map(([name, property]) => {
										const itemValue = value as Record<string, unknown>;
										const propertyValue = itemValue?.[name];

										return (
											<PropertiesControl
												key={name}
												name={name}
												property={property}
												value={propertyValue}
												onChange={(args) => {
													onChange({ ...(itemValue || {}), [args.name]: args.value });
												}}
											/>
										);
									})}
							</View>
						</Popover.Content>
					</Popover>
				) : (
					<PropertiesControl
						property={item}
						value={value}
						onChange={({ value }) => onChange(value)}
						name=""
						hideName
					/>
				)}
			</View.Item>
			<Button
				variant="ghost"
				icon={IconMinus}
				onClick={onRemove}
				attributes={{ "aria-label": "Delete an item" }}
			/>
		</View>
	);
};

const PropertyArrayAddControl = (props: T.ArrayAddControlProps) => {
	const { onAdd } = props;

	return (
		<Button icon={IconPlus} onClick={onAdd} fullWidth size="small">
			Add an item
		</Button>
	);
};

const PropertyArrayControl: React.FC<T.ArrayControlProps> = (props) => {
	const { name, value, item, onChange } = props;

	const updateValue = (value: unknown[]) => {
		onChange({ value: value.length ? value : undefined, name });
	};

	const handleRemove = (index: number) => {
		if (value === undefined || value.length < index - 1) return;

		const nextValue = [...value.slice(0, index), ...value.slice(index + 1)];
		updateValue(nextValue);
	};

	const handleAdd = () => {
		const addedValue = item.control?.defaultValue || item.defaultValue;

		updateValue(value ? [...value, addedValue] : [addedValue]);
	};

	const handleChange = (index: number, itemValue: unknown) => {
		if (!value) return;

		const nextValue = [...value];
		nextValue[index] = itemValue;
		updateValue(nextValue);
	};

	return (
		<>
			{value?.length
				? value.map((itemValue, i) => (
						<PropertyBaseControl key={i} name={name} hideName={i !== 0} preserveNameSpace>
							<PropertyArrayItemControl
								item={item}
								index={i}
								value={itemValue}
								onRemove={() => handleRemove(i)}
								onChange={(value) => handleChange(i, value)}
							/>
						</PropertyBaseControl>
				  ))
				: null}
			<PropertyBaseControl preserveNameSpace name={name} hideName={!!value?.length}>
				<PropertyArrayAddControl onAdd={handleAdd} />
			</PropertyBaseControl>
		</>
	);
};

export default PropertyArrayControl;
