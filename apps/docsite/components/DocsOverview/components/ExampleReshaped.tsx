import React from "react";
import { Icon } from "reshaped";
import IconReshaped from "icons/colored/Reshaped";
import Example from "./Example";

const ExampleReshaped = () => (
	<Example
		title="Reshaped provider"
		text="Global context provider that provides all of our and your components with a shared context"
		href="/content/docs/utilities/reshaped"
	>
		<Icon size={6} svg={IconReshaped} />
	</Example>
);

export default ExampleReshaped;
