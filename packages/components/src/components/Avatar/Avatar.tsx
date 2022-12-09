import React from "react";
import { classNames, responsiveVariables, responsivePropDependency } from "utilities/helpers";
import Icon from "components/Icon";
import View from "components/View";
import type * as T from "./Avatar.types";
import s from "./Avatar.module.css";
import getRadiusStyles from "styles/radius";

const Avatar = (props: T.Props) => {
	const { color = "neutral-faded" } = props;
	const { src, size = 12, squared, initials, icon, alt, className, attributes } = props;
	const radiusStyles = squared
		? getRadiusStyles(
				responsivePropDependency(size, (size) => {
					if (size >= 24) return "large";
					if (size >= 12) return "medium";
					return "small";
				})
		  )
		: getRadiusStyles("circular");
	const rootClassNames = classNames(
		s.root,
		className,
		color && s[`--color-${color}`],
		radiusStyles?.classNames
	);

	const renderContent = () => {
		if (src) return <img src={src} alt={alt} className={s.img} />;
		if (icon)
			return (
				<Icon svg={icon} size={responsivePropDependency(size, (size) => Math.ceil(size * 0.4))} />
			);
		return initials;
	};

	return (
		<View
			attributes={{ ...attributes, style: { ...responsiveVariables("--_s", size) } }}
			backgroundColor={color}
			className={rootClassNames}
		>
			{renderContent()}
		</View>
	);
};

export default Avatar;
