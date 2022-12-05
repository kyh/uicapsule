import React from "react";
import { Example } from "utilities/storybook";
import IconZap from "icons/Zap";
import Select from "components/Select";
import View from "components/View";
import FormControl from "components/FormControl";

export default { title: "Components/Select" };

export const selection = () => (
	<Example>
		<Example.Item title="unselected, placeholder">
			<Select
				name="animal"
				placeholder="Select an animal"
				options={[
					{ label: "Dog", value: "dog" },
					{ label: "Turtle", value: "turtle" },
				]}
			/>
		</Example.Item>

		<Example.Item title="selected, controlled">
			<Select
				name="animal"
				placeholder="Select an animal"
				defaultValue="dog"
				options={[
					{ label: "Dog", value: "dog" },
					{ label: "Turtle", value: "turtle" },
				]}
			/>
		</Example.Item>

		<Example.Item title="selected, uncontrolled">
			<Select
				name="animal"
				placeholder="Select an animal"
				value="dog"
				options={[
					{ label: "Dog", value: "dog" },
					{ label: "Turtle", value: "turtle" },
				]}
			/>
		</Example.Item>
	</Example>
);

export const disabled = () => (
	<Example>
		<Example.Item title="disabled">
			<Select
				disabled
				name="animal"
				placeholder="Select an animal"
				options={[
					{ label: "Dog", value: "dog" },
					{ label: "Turtle", value: "turtle" },
				]}
			/>
		</Example.Item>
	</Example>
);

export const error = () => (
	<Example>
		<Example.Item title="error">
			<Select
				name="animal"
				hasError
				placeholder="Select an animal"
				options={[
					{ label: "Dog", value: "dog" },
					{ label: "Turtle", value: "turtle" },
				]}
			/>
		</Example.Item>
	</Example>
);

export const icon = () => (
	<Example>
		<Example.Item title="icon">
			<Select
				name="animal"
				placeholder="Select an animal"
				options={[
					{ label: "Dog", value: "dog" },
					{ label: "Turtle", value: "turtle" },
				]}
				icon={IconZap}
			/>
		</Example.Item>
	</Example>
);

export const slots = () => (
	<Example>
		<Example.Item title="startSlot">
			<Select
				name="animal"
				placeholder="Select an animal"
				options={[
					{ label: "Dog", value: "dog" },
					{ label: "Turtle", value: "turtle" },
				]}
				startSlot={
					<View height="20px" width="20px" backgroundColor="neutral" borderRadius="small" />
				}
			/>
		</Example.Item>
	</Example>
);

export const formControl = () => (
	<Example>
		<Example.Item title={["with helper", "error is hidden"]}>
			<FormControl>
				<FormControl.Label>Name</FormControl.Label>
				<Select
					name="animal"
					placeholder="Select an animal"
					options={[
						{ label: "Dog", value: "dog" },
						{ label: "Turtle", value: "turtle" },
					]}
				/>
				<FormControl.Helper>Helper</FormControl.Helper>
				<FormControl.Error>This field is required</FormControl.Error>
			</FormControl>
		</Example.Item>
		<Example.Item title={["with error"]}>
			<FormControl hasError>
				<FormControl.Label>Name</FormControl.Label>
				<Select
					name="animal"
					placeholder="Select an animal"
					options={[
						{ label: "Dog", value: "dog" },
						{ label: "Turtle", value: "turtle" },
					]}
				/>
				<FormControl.Error>This field is required</FormControl.Error>
			</FormControl>
		</Example.Item>
	</Example>
);
