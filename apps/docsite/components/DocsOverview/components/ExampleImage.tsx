import React from "react";
import { Image } from "reshaped";
import Example from "./Example";

const ExampleImage = () => (
	<Example
		title="Image"
		text="Utility for displaying images and controlling their behavior"
		href="/content/docs/utilities/image"
	>
		<Image
			src="/img/examples/image-retina.webp"
			alt="Canyon rock"
			borderRadius="medium"
			width="200px"
			height="100%"
		/>
	</Example>
);

export default ExampleImage;
