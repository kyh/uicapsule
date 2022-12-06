import React from "react";
import NextLink from "next/link";
import { ThemeProvider, Badge, Container, Text, Button, View } from "reshaped";
import BlockFeature from "components/BlockFeature";
import Price from "constants/prices";
import IconArrowRight from "icons/ArrowRight";
import * as ga from "utilities/ga";
import s from "./SectionSource.module.css";

const SectionSource = () => {
	return (
		<ThemeProvider colorMode="dark">
			<div className={s.root}>
				<Container width="1056px">
					<View gap={14}>
						<View.Item columns={{ s: 12, l: 7 }}>
							<View gap={2} align="start">
								<Badge variant="outline">Pro license</Badge>
								<View.Item gapBefore={5}>
									<Text variant="display-3" as="h2">
										Building your
										<br /> own design system?
									</Text>
								</View.Item>
								<Text variant="featured-3" color="neutral-faded" as="p">
									Use Reshaped to start from a point where all core challenges are already solved
									with our pro license. Get access to Reshaped as we develop it and tweak anything
									you feel like.
								</Text>

								<View.Item gapBefore={4}>
									<NextLink href="/pricing?type=source" passHref>
										<Button
											size="large"
											color="primary"
											endIcon={IconArrowRight}
											onClick={() => {
												ga.trackEvent({
													category: ga.EventCategory.Pricing,
													action: "pricing_click_source_section",
												});
											}}
										>
											${Price.sourceCode / 100} Buy now
										</Button>
									</NextLink>
								</View.Item>

								<Text color="neutral-faded" variant="body-2">
									Includes React and Figma source files
								</Text>
							</View>
						</View.Item>

						<View direction={{ s: "column", m: "row" }} gap={{ s: 4, l: 5 }} align="stretch">
							<BlockFeature
								horizontal
								title="Source code"
								text="You get access to Reshaped implementation of all components and utilities with a fully working development environment and Storybook examples. "
								action={{
									children: "Component demo",
									endIcon: IconArrowRight,
									href: "https://github.com/reshaped/community/tree/master/demo/components/Modal",
									attributes: { target: "_blank" },
								}}
							>
								<img src="/img/landing/source/component.svg" alt="Component file structure" />
							</BlockFeature>
							<View.Item columns={{ s: 12, m: 6 }}>
								<BlockFeature
									bleedPreview
									title="Unlimited seats"
									text="Pro license can be used for your whole company, no more hassle with managing individual licenses."
								>
									<img src="/img/landing/source/users.svg" alt="User graph" className={s.users} />
								</BlockFeature>
							</View.Item>
							<View.Item columns={{ s: 12, m: 6 }}>
								<BlockFeature
									bleedPreview
									title="Extendable tests"
									text="Get access to the test suite and Storybook files for the whole library. Keep your tests in sync for your new features with zero overhead."
								>
									<img
										src="/img/landing/source/test.svg"
										alt="Component tests status"
										className={s.test}
									/>
								</BlockFeature>
							</View.Item>
						</View>
					</View>
				</Container>
			</div>
		</ThemeProvider>
	);
};

export default SectionSource;
