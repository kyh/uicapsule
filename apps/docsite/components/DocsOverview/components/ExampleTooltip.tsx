import React from "react";
import { Tooltip, Button } from "reshaped";
import IconMic from "icons/Mic";
import Example from "./Example";

const ExampleTextField = () => (
	<Example
		title="Tooltip"
		text="Contextual text information display on element hover or focus"
		href="/content/docs/components/tooltip"
	>
		<Tooltip text="Record a message" position="top" active>
			{(attributes) => (
				<Button attributes={attributes} startIcon={IconMic} color="primary" rounded />
			)}
		</Tooltip>
	</Example>
);

export default ExampleTextField;
