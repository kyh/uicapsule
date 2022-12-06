import React from "react";
import { Breadcrumbs } from "reshaped";
import Example from "./Example";

const ExampleBreadcrumbs = () => (
	<Example
		title="Breadcrumbs"
		text="Top-level product navigation that helps user understand the location of the current page and navigate back to its parents"
		href="/content/docs/components/breadcrumbs"
	>
		<Breadcrumbs defaultVisibleItems={2} color="primary">
			<Breadcrumbs.Item onClick={() => {}}>Catalog</Breadcrumbs.Item>
			<Breadcrumbs.Item onClick={() => {}}>Shoes</Breadcrumbs.Item>
			<Breadcrumbs.Item onClick={() => {}}>Running</Breadcrumbs.Item>
			<Breadcrumbs.Item>Ultraboost</Breadcrumbs.Item>
		</Breadcrumbs>
	</Example>
);

export default ExampleBreadcrumbs;
