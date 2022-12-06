import React from "react";
import { View, Text, Button } from "reshaped";
import * as T from "./BlockFeature.types";
import s from "./BlockFeature.module.css";

const BlockFeature = (props: T.Props) => {
	const { horizontal, title, text, action, bleedPreview, autoHeightPreview, children } = props;

	return (
		<View
			overflow="hidden"
			backgroundColor="neutral-faded"
			padding={{ s: 6, l: 8 }}
			height="100%"
			justify="start"
			borderRadius="medium"
			gap={horizontal ? { s: 6, l: 10 } : 6}
			direction={horizontal ? { s: "column", l: "row" } : "column"}
			align="center"
			className={[s.root, bleedPreview && s["--bleed"], horizontal && s["--horiontal"]]}
		>
			<View.Item grow className={s.previewWrap}>
				<View
					height={horizontal || autoHeightPreview ? undefined : { s: "auto", l: "250px" }}
					width={{ s: "auto", l: horizontal ? "480px" : undefined }}
					maxWidth="100%"
					justify="center"
					align="center"
				>
					<div className={s.preview}>
						<div className={s.inner}>{children}</div>
					</div>
				</View>
			</View.Item>
			<View.Item grow={horizontal}>
				<View gap={2} align="start">
					<Text variant="title-2" as="h3">
						{title}
					</Text>
					<Text variant="body-1" color="neutral-faded" as="p">
						{text}
					</Text>
					{action && (
						<View.Item gapBefore={4}>
							<Button {...action} size="large" variant="outline" />
						</View.Item>
					)}
				</View>
			</View.Item>
		</View>
	);
};

export default BlockFeature;
