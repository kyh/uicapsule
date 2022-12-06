import React from "react";
import { Hidden } from "reshaped";
import Example from "./Example";

const ExampleHidden = () => (
	<Example
		title="Hidden"
		text="Utility that lets you hide content responsively with server-side rendering support"
		href="/content/docs/utilities/hidden"
	>
		<Hidden hide={{ s: true, m: false }}>Hidden for small viewport</Hidden>
		<Hidden hide={{ s: false, m: true }}>Hidden for medium+ viewports</Hidden>
	</Example>
);

export default ExampleHidden;
