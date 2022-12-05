import React from "react";
import {
	classNames,
	responsiveVariables,
	responsiveClassNames,
	responsivePropDependency,
} from "utilities/helpers";
import Actionable, { ActionableRef } from "components/Actionable";
import type * as T from "./Card.types";
import s from "./Card.module.css";

const Card = <As extends keyof JSX.IntrinsicElements = "div">(
	props: T.Props<As>,
	ref: React.Ref<HTMLElement>
) => {
	const { padding = 4 } = props;
	const {
		selected,
		elevated,
		bleed,
		onClick,
		href,
		children,
		className,
		attributes,
		/**
		 * Using any here to let TS save on type resolving, otherwise TS throws an error due to the type complexity
		 * It still resolves the attributes correctly based on the tag
		 */
		as: TagName = "div" as any,
	} = props;
	const isActionable = !!href || !!onClick;

	const rootClassNames = classNames(
		s.root,
		isActionable && s["--actionable"],
		elevated && s["--elevated"],
		selected && s["--selected"],
		...responsiveClassNames(
			s,
			"--bleed",
			responsivePropDependency(bleed, (value) => typeof value === "number" && value > 0)
		),
		className
	);

	const style = {
		...attributes?.style,
		...responsiveVariables("--_p", padding),
		...responsiveVariables("--_b", bleed),
	};

	if (isActionable) {
		return (
			<Actionable
				className={rootClassNames}
				attributes={{ ...attributes, style } as any}
				href={href}
				as={TagName}
				onClick={onClick}
				ref={ref as ActionableRef}
			>
				<span className={s.content}>{children}</span>
			</Actionable>
		);
	}

	return (
		<TagName
			{...attributes}
			onClick={onClick}
			href={href}
			ref={ref}
			className={rootClassNames}
			style={style}
		>
			<span className={s.content}>{children}</span>
		</TagName>
	);
};

export default React.forwardRef(Card);
