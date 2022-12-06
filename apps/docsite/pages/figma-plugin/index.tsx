import React from "react";
import { Text, Hidden } from "reshaped";
import SectionFigmaPlugin from "components/SectionFigmaPlugin";

const FigmaPluginRoute = () => {
	const text = (
		<>
			Oh, hi! I&apos;m a{" "}
			<Text color="primary" as="span">
				Figma plugin
			</Text>{" "}
			that can add themes and switch to dark mode. I&apos;m free, work locally and do it blazingly
			fast.{" "}
			<Hidden hide={{ s: true, l: false }}>{(className) => <br className={className} />}</Hidden>
			Try me, I&apos;m good!
		</>
	);

	return (
		<SectionFigmaPlugin>
			<Hidden hide={{ s: true, l: false }}>
				<Text variant="display-3">{text}</Text>
			</Hidden>
			<Hidden hide={{ s: false, l: true }}>
				<Text variant="title-1" align="center">
					{text}
				</Text>
			</Hidden>
		</SectionFigmaPlugin>
	);
};

export default FigmaPluginRoute;
