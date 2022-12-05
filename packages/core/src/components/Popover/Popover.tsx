import React from "react";
import { classNames } from "utilities/helpers";
import Flyout, { FlyoutRefProps } from "components/_private/Flyout";
import type * as T from "./Popover.types";
import s from "./Popover.module.css";

const Popover = (props: T.Props) => {
	const {
		id,
		forcePosition,
		onOpen,
		onClose,
		active,
		defaultActive,
		children,
		width,
		padding,
		triggerType = "click",
		position = "bottom",
	} = props;
	const flyoutRef = React.useRef<FlyoutRefProps | null>(null);
	const contentClassName = classNames(s.root, !!width && s["--has-width"]);
	const trapFocusMode =
		props.trapFocusMode || (triggerType === "hover" ? "content-menu" : undefined);

	return (
		// @ts-ignore
		<Flyout
			id={id}
			ref={flyoutRef}
			position={position}
			forcePosition={forcePosition}
			onOpen={onOpen}
			onClose={onClose}
			trapFocusMode={trapFocusMode}
			triggerType={triggerType}
			active={active}
			defaultActive={defaultActive}
			width={width}
			contentClassName={contentClassName}
			contentAttributes={{ style: { "--_p": padding } }}
		>
			{children}
		</Flyout>
	);
};

Popover.Content = Flyout.Content;
Popover.Trigger = Flyout.Trigger;
export default Popover;
