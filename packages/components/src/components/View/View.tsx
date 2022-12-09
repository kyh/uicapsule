import React from "react";
import {
	classNames,
	responsiveClassNames,
	responsiveVariables,
	responsivePropDependency,
} from "utilities/helpers";
import Divider, { DividerProps } from "components/Divider";
import Hidden from "components/Hidden";
import type * as G from "types/global";
import type * as T from "./View.types";
import s from "./View.module.css";
import getRadiusStyles from "styles/radius";
import getBleedStyles from "styles/bleed";
import getWidthStyles from "styles/width";
import getHeightStyles from "styles/height";
import getMaxWidthStyles from "styles/maxWidth";
import getMaxHeightStyles from "styles/maxHeight";

const ViewItem = <As extends keyof JSX.IntrinsicElements = "div">(props: T.ItemProps<As>) => {
	const {
		columns,
		grow,
		gapBefore,
		as: TagName = "div" as any,
		order,
		children,
		className,
		attributes,
	} = props;
	const itemClassNames = classNames(
		s.item,
		className,
		gapBefore === "auto" && s["item--gap-auto"],
		gapBefore !== undefined && s["item--gap-before"],
		...responsiveClassNames(s, "item--grow", grow),
		...responsiveClassNames(s, "item--columns", columns)
	);

	const itemVariables = {
		...responsiveVariables("--_o", order),
		...responsiveVariables("--_gi", gapBefore),
	};

	return (
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		<TagName {...attributes} style={itemVariables} className={itemClassNames}>
			{children}
		</TagName>
	);
};

const View = <As extends keyof JSX.IntrinsicElements = "div">(props: T.Props<As>) => {
	const {
		/**
		 * Layout props
		 */
		align,
		justify,
		wrap,
		gap,
		height,
		width,
		maxHeight,
		maxWidth,
		padding,
		paddingBottom,
		paddingEnd,
		paddingStart,
		paddingTop,
		bleed,

		/**
		 * Style props
		 * */
		animated,
		backgroundColor,
		borderColor,
		borderRadius,
		shadow,
		textAlign,
		overflow,

		/**
		 * Using any here to let TS save on type resolving, otherwise TS throws an error due to the type complexity
		 * It still resolves the attributes correctly based on the tag
		 */
		as: TagName = "div" as any,
		children,
		divided,
		className,
		attributes,
	} = props;
	const isFlex = !!align || !!justify || !!gap || !!props.direction;
	const direction = props.direction || (isFlex ? "column" : undefined);
	const radiusStyles = getRadiusStyles(borderRadius);
	const bleedStyles = getBleedStyles(bleed);
	const widthStyles = getWidthStyles(width);
	const heightStyles = getHeightStyles(height);
	const maxWidthStyles = getMaxWidthStyles(maxWidth);
	const maxHeightStyles = getMaxHeightStyles(maxHeight);

	let renderedItemIndex = 0;
	// If wrap is not defined, it can be set based on item grow and split usage
	let nowrap;

	const renderDivider: T.RenderDivider = ({ className, key }) => {
		const dividerClassName = classNames(s.divider, className);
		let isDividerVertical: DividerProps["vertical"] = false;

		if (typeof direction === "string" && direction.startsWith("row")) {
			isDividerVertical = true;
		} else if (direction) {
			const viewports = Object.keys(direction) as Array<keyof G.ResponsiveOnly<string>>;
			isDividerVertical = viewports.reduce((acc, viewport) => {
				const viewportDirection = (direction as G.ResponsiveOnly<T.Direction>)[viewport];

				if (!viewportDirection) return acc;

				return {
					...acc,
					[viewport]: viewportDirection.startsWith("row"),
				};
			}, {} as G.ResponsiveOnly<boolean>);
		}

		return (
			<div className={dividerClassName} key={`${key}-divider`}>
				<Divider vertical={isDividerVertical} />
			</div>
		);
	};

	const renderItem: T.RenderItem = ({ className, child, index }) => {
		const isItem = child.type === ViewItem;
		const key = child.key || index;
		const dividerElement = !!index && divided && renderDivider({ className, key });
		let itemElement;

		if (isItem) {
			itemElement = React.cloneElement(child, {
				className: classNames(className, child.props.className),
			});
		} else if (className || !React.isValidElement(child)) {
			itemElement = (
				<div className={className} key={key}>
					{child}
				</div>
			);
		} else {
			itemElement = child;
		}

		// Passing grow here because it's responsive and nowrap should follow it
		if (isItem && child.props?.grow) nowrap = child.props.grow;
		if (isItem && child.props?.gap === "auto") nowrap = true;

		return [dividerElement, itemElement];
	};

	const formattedChildren = React.Children.map(children, (child: any, index) => {
		if (!child) return null;

		// Ignore the indices of the items that rendered nothing
		const renderedIndex = renderedItemIndex;
		renderedItemIndex += 1;

		if (child.type === Hidden && typeof child.props.children !== "function") {
			const { children: hiddenChild, ...hiddenProps } = child.props;
			const key = child.key || index;

			return (
				<Hidden {...hiddenProps} key={key}>
					{(className) => renderItem({ className, child: hiddenChild, index: renderedIndex })}
				</Hidden>
			);
		}

		return renderItem({ child, index: renderedIndex });
	});

	// Classnames and attributes are written here so we can assign nowrap to the root element based on the children
	const rootClassNames = classNames(
		s.root,
		className,
		radiusStyles?.classNames,
		bleedStyles?.classNames,
		widthStyles?.classNames,
		heightStyles?.classNames,
		maxWidthStyles?.classNames,
		maxHeightStyles?.classNames,
		textAlign && s[`--align-text-${textAlign}`],
		backgroundColor && s[`--bg-${backgroundColor}`],
		borderColor && s[`--bd-${borderColor}`],
		borderColor && s["--bd"],
		shadow && s[`--shadow-${shadow}`],
		overflow && s[`--overflow-${overflow}`],
		animated && s["--animated"],
		padding !== undefined && s["--padding"],
		paddingBottom !== undefined && s["--padding-bottom"],
		paddingEnd !== undefined && s["--padding-end"],
		paddingStart !== undefined && s["--padding-start"],
		paddingTop !== undefined && s["--padding-top"],
		(isFlex || nowrap) && s["--flex"],
		...responsiveClassNames(s, "--direction", direction),
		...responsiveClassNames(s, "--align", align),
		...responsiveClassNames(s, "--justify", justify),
		// Wrap and nowrap are separate here because inverting any of them could result into a false value which will be ignored by classNames
		...responsiveClassNames(s, "--nowrap", nowrap || wrap === false),
		...responsiveClassNames(s, "--wrap", wrap)
	);

	const rootVariables = {
		...attributes?.style,
		...responsiveVariables("--_g", gap),
		...responsiveVariables(
			"--_pv",
			padding &&
				responsivePropDependency(padding, (value) => (typeof value === "number" ? value : value[0]))
		),
		...responsiveVariables(
			"--_ph",
			padding &&
				responsivePropDependency(padding, (value) => (typeof value === "number" ? value : value[1]))
		),
		...responsiveVariables("--_pb", paddingBottom),
		...responsiveVariables("--_pt", paddingTop),
		...responsiveVariables("--_ps", paddingStart),
		...responsiveVariables("--_pe", paddingEnd),
		...bleedStyles?.variables,
		...widthStyles?.variables,
		...heightStyles?.variables,
		...maxWidthStyles?.variables,
		...maxHeightStyles?.variables,
	};

	return (
		<TagName {...attributes} className={rootClassNames} style={rootVariables}>
			{formattedChildren}
		</TagName>
	);
};

View.Item = ViewItem;
export default View;
