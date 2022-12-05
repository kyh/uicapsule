import React from "react";
import Card from "components/Card";
import Button from "components/Button";
import View from "components/View";
import MenuItem from "components/MenuItem";
import ThemeProvider, { useTheme } from "components/Theme";
import { Example } from "utilities/storybook";

export default { title: "Utilities/Theme" };

const Demo = () => {
	const { invertColorMode } = useTheme();

	return (
		<View gap={3}>
			<Button onClick={invertColorMode}>Invert mode</Button>

			<MenuItem selected>Test transition</MenuItem>

			<Card>Default card</Card>

			<ThemeProvider colorMode="inverted">
				<Card>Inverted card</Card>
			</ThemeProvider>
		</View>
	);
};

export const edgeCases = () => (
	<Example>
		<Example.Item title="should have no transitions while switching color mode">
			<Demo />
		</Example.Item>
	</Example>
);
