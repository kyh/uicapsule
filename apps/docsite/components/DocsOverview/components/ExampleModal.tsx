import React from "react";
import { View, Text, Button } from "reshaped";
import Example from "./Example";

const ExampleModal = () => (
	<Example
		title="Modal"
		text="Container appearing in front of the main content to provide critical information or an actionable piece of content"
		href="/content/docs/components/modal"
	>
		<div
			style={{
				position: "absolute",
				inset: 0,
				background: "rgba(0, 0, 0, 0.4)",
				padding: 16,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<View backgroundColor="elevated" borderRadius="medium" padding={3} gap={1} align="start">
				<Text>Reset your device to its default factory settings?</Text>
				<Button.Aligner position="start">
					<View direction="row" gap={2}>
						<Button size="small" variant="ghost" color="critical">
							Reset
						</Button>
						<Button size="small" variant="ghost">
							Cancel
						</Button>
					</View>
				</Button.Aligner>
			</View>
		</div>
	</Example>
);

export default ExampleModal;
