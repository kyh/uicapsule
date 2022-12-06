import React from "react";
import { View, Text } from "reshaped";

const Section = (props: { title: string; children: React.ReactNode }) => (
	<View gap={3}>
		<Text variant="title-3" as="h4">
			{props.title}
		</Text>

		<View gap={3} direction={{ s: "row", m: "column" }}>
			{React.Children.map(props.children, (item) => {
				if (!item) return;
				return <View.Item columns={{ s: 6, m: 12 }}>{item}</View.Item>;
			})}
		</View>
	</View>
);

export default Section;
