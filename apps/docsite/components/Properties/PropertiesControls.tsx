import React from "react";
import { Modal, View, Dismissible, Text } from "reshaped";
import PropertiesControl from "./PropertiesControl";
import { useProperties } from "./PropertiesProvider";
import { isIgnoredControl } from "./utiltiies";
import * as T from "./Properties.types";

const PropertyControls = (props: T.ControlsProps) => {
	const { active, onClose, onPropertyChange, values } = props;
	const properties = useProperties();

	return (
		<Modal
			transparentBackdrop
			position="end"
			active={active}
			onClose={onClose}
			padding={4}
			size="380px"
		>
			<View gap={6}>
				<Dismissible closeAriaLabel="Close controls" onClose={onClose}>
					<Modal.Title>
						<Text variant="body-strong-1">Controls</Text>
					</Modal.Title>
				</Dismissible>

				{Object.entries(properties).map(([sectionName, section]) => {
					const entries = Object.entries(section);
					const hasVisibleControl =
						entries.findIndex(([name, property]) => !isIgnoredControl(property, name)) !== -1;

					if (!hasVisibleControl) return null;

					return (
						<View gap={2} key={sectionName}>
							{sectionName !== "base" && (
								<View
									padding={[2, 4]}
									bleed={4}
									backgroundColor="neutral-faded"
									borderColor="neutral-faded"
								>
									<Text variant="body-strong-2">
										{sectionName[0].toUpperCase() + sectionName.slice(1)} controls
									</Text>
								</View>
							)}
							{entries.map(([name, property]) => {
								const value = values[sectionName][name];
								const handleChange: T.BaseControl<T.Property, unknown>["onChange"] = (args) =>
									onPropertyChange(sectionName, args);

								return (
									<PropertiesControl
										value={value}
										name={name}
										key={name}
										onChange={handleChange}
										property={property}
									/>
								);
							})}
						</View>
					);
				})}
			</View>
		</Modal>
	);
};

export default PropertyControls;
