import React from "react";
import { View } from "reshaped";
import PropertyStringDocs from "./PropertyString/PropertyStringDocs";
import PropertySlotDocs from "./PropertySlot/PropertySlotDocs";
import PropertyEnumDocs from "./PropertyEnum/PropertyEnumDocs";
import PropertyBooleanDocs from "./PropertyBoolean/PropertyBooleanDocs";
import PropertyNumberDocs from "./PropertyNumber/PropertyNumberDocs";
import PropertyIconDocs from "./PropertyIcon/PropertyIconDocs";
import PropertyArrayDocs from "./PropertyArray/PropertyArrayDocs";
import PropertyObjectDocs from "./PropertyObject/PropertyObjectDocs";
import PropertyFunctionDocs from "./PropertyFunction/PropertyFunctionDocs";
import PropertyCustomDocs from "./PropertyCustom/PropertyCustomDocs";
import { useProperties } from "./PropertiesProvider";
import * as T from "./Properties.types";
import s from "./Properties.module.css";

const componentMap: Partial<Record<T.ControlType, React.FC<T.DocsProps<any>>>> = {
	[T.ControlType.string]: PropertyStringDocs,
	[T.ControlType.number]: PropertyNumberDocs,
	[T.ControlType.slot]: PropertySlotDocs,
	[T.ControlType.enum]: PropertyEnumDocs,
	[T.ControlType.boolean]: PropertyBooleanDocs,
	[T.ControlType.icon]: PropertyIconDocs,
	[T.ControlType.array]: PropertyArrayDocs,
	[T.ControlType.object]: PropertyObjectDocs,
	[T.ControlType.function]: PropertyFunctionDocs,
	[T.ControlType.custom]: PropertyCustomDocs,
};

const PropertiesTable = (props: T.TableProps) => {
	const { name = "base" } = props;
	const properties = useProperties()[name];

	if (!properties) return null;

	return (
		<div>
			<View direction="row" gap={2} className={s.property}>
				<View width={{ s: "120px", m: "140px" }}>Name</View>
				<View.Item grow>Type</View.Item>
			</View>
			{Object.entries(properties).map(([name, property]) => {
				const { type } = property;
				const Component = componentMap[type];

				if (!Component) return null;

				return <Component property={property} name={name} key={name} />;
			})}
		</div>
	);
};

export default PropertiesTable;
