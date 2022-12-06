import React from "react";
import { View, Text } from "reshaped";
import SectionHero from "components/SectionHero";
import SectionUsers from "components/SectionUsers";
import SectionProduct from "components/SectionProduct";
import SectionReact from "components/SectionReact";
import SectionFigma from "components/SectionFigma";
import SectionFigmaPlugin from "components/SectionFigmaPlugin";
import SectionMore from "components/SectionMore";
import SectionSource from "components/SectionSource";
import SectionPricing from "components/SectionPricing";
import Footer from "components/Footer";

const IndexRoute = () => {
	return (
		<View gap={{ s: 28, l: 36 }}>
			<SectionHero />
			<View.Item gapBefore={30}>
				<SectionUsers />
			</View.Item>
			<SectionProduct />
			<SectionReact />
			<SectionFigma />
			<SectionFigmaPlugin embed>
				<View gap={2}>
					<Text variant="display-3" align={{ s: "center", l: "start" }}>
						Keep your themes organised in Figma
					</Text>
					<Text variant="featured-3" color="neutral-faded" align={{ s: "center", l: "start" }}>
						We&apos;ve created a simple Figma plugin that can add themes and switch to dark mode.
						It&apos;s free, works locally and does it blazingly fast.
					</Text>
				</View>
			</SectionFigmaPlugin>
			<SectionMore />
			<SectionSource />
			<SectionPricing />
			<View.Item gapBefore={30}>
				<Footer />
			</View.Item>
		</View>
	);
};

export default IndexRoute;
