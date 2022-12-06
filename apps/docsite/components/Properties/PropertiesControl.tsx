import React from "react";
import PropertyStringControl from "./PropertyString/PropertyStringControl";
import PropertySlotControl from "./PropertySlot/PropertySlotControl";
import PropertyEnumControl from "./PropertyEnum/PropertyEnumControl";
import PropertyBooleanControl from "./PropertyBoolean/PropertyBooleanControl";
import PropertyIconControl from "./PropertyIcon/PropertyIconControl";
import PropertyNumberControl from "./PropertyNumber/PropertyNumberControl";
import PropertyArrayControl from "./PropertyArray/PropertyArrayControl";
import PropertyObjectControl from "./PropertyObject/PropertyObjectControl";
import { isIgnoredControl } from "./utiltiies";
import * as T from "./Properties.types";

const componentMap: Partial<Record<T.ControlType, React.FC<any>>> = {
	[T.ControlType.string]: PropertyStringControl,
	[T.ControlType.number]: PropertyNumberControl,
	[T.ControlType.slot]: PropertySlotControl,
	[T.ControlType.enum]: PropertyEnumControl,
	[T.ControlType.boolean]: PropertyBooleanControl,
	[T.ControlType.icon]: PropertyIconControl,
	[T.ControlType.array]: PropertyArrayControl,
	[T.ControlType.object]: PropertyObjectControl,
};

const PropertiesControl = (props: {
	property: T.Property;
	name: string;
	value?: unknown;
	hideName?: boolean;
	onChange: T.BaseControl<T.Property, unknown>["onChange"];
}) => {
	const { property, value, name, hideName, onChange } = props;
	const Component = componentMap[property.type];

	if (isIgnoredControl(property, name) || !Component) {
		return null;
	}

	return (
		<Component {...property} hideName={hideName} onChange={onChange} value={value} name={name} />
	);
};

export default PropertiesControl;
