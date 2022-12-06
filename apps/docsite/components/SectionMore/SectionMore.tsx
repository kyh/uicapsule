import React from "react";
import { Container, Text, View, Icon, Hidden } from "reshaped";
import IconDocumentation from "icons/Documentation";
import IconComposition from "icons/Composition";
import IconAccessibility from "icons/Accessibility";
import IconResponsive from "icons/Responsive";
import IconColors from "icons/Colors";
import IconDarkMode from "icons/Moon";

const data = [
	{
		icon: IconDocumentation,
		color: "var(--rs-color-foreground-primary)",
		title: "Documentation",
		text: "Thorough technical and design documentation, best-practices and real-world examples",
	},
	{
		icon: IconComposition,
		color: "var(--rs-color-foreground-critical)",
		title: "Composable architecture",
		text: "Built in flexibility that lets you develop your own components in minutes ",
	},
	{
		icon: IconAccessibility,
		title: "Accessibility",
		color: "var(--rs-color-foreground-neutral-faded)",
		text: "WCAG AA compliant starting from color contrast and up to the screen reader navigation",
	},
	{
		icon: IconResponsive,
		title: "Responsive styles",
		color: "var(--rs-color-foreground-positive)",
		text: "Components that dynamically adapt to different viewport sizes ",
	},
	{
		icon: IconColors,
		title: "Theming ",
		color: "#FF9534",
		text: "Themes supported out-of-the-box for all components with contextual tokens",
	},
	{
		icon: IconDarkMode,
		title: "Dark mode",
		color: "var(--rs-color-foreground-neutral-faded)",
		text: "Dark mode support embedded into each theme through semantic colors",
	},
];

const SectionMore = () => (
	<Container width="1056px">
		<View gap={18}>
			<Container width="852px" padding={0}>
				<View gap={3}>
					<Text variant="display-3" align="center" as="h2">
						Everything you would expect{" "}
						<Hidden hide={{ s: true, m: false }}>
							{(className) => <br className={className} />}
						</Hidden>{" "}
						from a design system
					</Text>
				</View>
			</Container>

			<View gap={{ s: 6, l: 10 }} direction={{ s: "column", m: "row" }}>
				{data.map((item) => (
					<View.Item columns={{ s: 12, m: 6, l: 4 }} key={item.title}>
						<View direction="row" gap={5}>
							<View
								height={`${16 * 4}px`}
								width={`${16 * 4}px`}
								borderRadius="medium"
								backgroundColor="neutral-faded"
								align="center"
								justify="center"
								attributes={{ style: { color: item.color } }}
							>
								<Icon svg={item.icon} size={7} />
							</View>
							<View.Item grow>
								<View gap={1}>
									<Text variant="body-strong-1" as="h3">
										{item.title}
									</Text>
									<Text variant="body-1" color="neutral-faded" as="p">
										{item.text}
									</Text>
								</View>
							</View.Item>
						</View>
					</View.Item>
				))}
			</View>
		</View>
	</Container>
);

export default SectionMore;
