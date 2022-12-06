import React from "react";
import { View, FormControl } from "reshaped";
import * as T from "../Properties.types";
import s from "../Properties.module.css";

const PropertyBaseControl = (props: T.BaseControlProps) => {
	const { name, children, preserveNameSpace, hideName } = props;
	const splitName = !hideName && name.replace(/([A-Z])/g, " $1");
	const capitalizedName =
		splitName && splitName.charAt(0).toUpperCase() + splitName.slice(1).toLowerCase();

	return (
		<FormControl>
			<View direction="row" gap={2} align="center">
				{(capitalizedName || preserveNameSpace) && (
					<View className={s.propertyLabel}>
						<FormControl.Label>{capitalizedName}</FormControl.Label>
					</View>
				)}
				<View.Item grow>{children}</View.Item>
			</View>
		</FormControl>
	);
};

export default PropertyBaseControl;
