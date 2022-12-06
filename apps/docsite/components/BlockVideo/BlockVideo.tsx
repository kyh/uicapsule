import React from "react";
import { Actionable, View, Button, Text, Overlay, useToggle } from "reshaped";
import * as ga from "utilities/ga";
import IconPlay from "icons/Play";
import VideoDemo from "components/VideoDemo";
import * as T from "./BlockVideo.types";
import s from "./BlockVideo.module.css";

const BlockVideo = (props: T.Props) => {
	const { label, previewSrc, src, backgroundContain } = props;
	const { activate, deactivate, active } = useToggle();

	const handleOpen = () => {
		ga.trackEvent({
			category: ga.EventCategory.Landing,
			action: `landing_${label.replace(/ /g, "_").toLowerCase()}`,
		});

		activate();
	};

	return (
		<>
			<Actionable onClick={handleOpen} className={s.root}>
				<View
					overflow="hidden"
					borderRadius="medium"
					height="100%"
					justify="center"
					align="center"
					className={s.preview}
					attributes={{
						style: {
							backgroundImage: `url(${previewSrc})`,
							backgroundSize: backgroundContain ? "contain" : "cover",
						},
					}}
				>
					<Overlay>
						<View gap={3} align="center">
							<Button size="large" rounded startIcon={IconPlay} color="white" elevated as="span" />
							<Text variant="featured-3">{label}</Text>
						</View>
					</Overlay>
				</View>
			</Actionable>

			<VideoDemo active={active} onClose={deactivate} src={src} />
		</>
	);
};

export default BlockVideo;
