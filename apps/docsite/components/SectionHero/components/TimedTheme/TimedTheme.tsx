import React from "react";
import {
	Container,
	View,
	Text,
	Progress,
	Actionable,
	Hidden,
	useIsomorphicLayoutEffect,
} from "reshaped";
import * as T from "./TimedTheme.types";

const duration = 5000;

const TimedTheme = (props: T.Props) => {
	const { onThemeChange, themeIndex, themes } = props;
	const [mounted, setMounted] = React.useState(false);
	const [manual, setManual] = React.useState(false);

	const handleThemeClick = async (index: number) => {
		setManual(true);
		onThemeChange(index);
	};

	useIsomorphicLayoutEffect(() => {
		setMounted(true);

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				onThemeChange(0);
			});
		});
	}, []);

	React.useEffect(() => {
		if (!mounted || manual) return;

		const timer = setTimeout(() => {
			onThemeChange(themeIndex === 2 || themeIndex === null ? 0 : themeIndex + 1);
		}, duration);

		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [manual, mounted, themeIndex]);

	return (
		<Container width="652px" attributes={{ "aria-hidden": true }}>
			<View direction="row" gap={{ s: 2, m: 5 }}>
				{themes.map((theme, index) => (
					<View.Item columns={4} key={theme}>
						<Actionable onClick={() => handleThemeClick(index)} fullWidth>
							<View gap={3}>
								<Text variant="body-medium-2" align="center">
									{theme.charAt(0).toUpperCase()}
									{theme.slice(1)}{" "}
									<Hidden hide={{ s: true, m: false }} inline>
										theme
									</Hidden>
								</Text>
								<Progress
									value={themeIndex === index ? 100 : 0}
									size="small"
									duration={themeIndex === index && !manual ? duration : 1}
								/>
							</View>
						</Actionable>
					</View.Item>
				))}
			</View>
		</Container>
	);
};

export default TimedTheme;
