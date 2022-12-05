import React from "react";
import { classNames, responsiveVariables } from "utilities/helpers";
import * as T from "./Image.types";
import s from "./Image.module.css";

const Image = (props: T.Props) => {
	const {
		src,
		alt,
		width,
		height,
		onLoad,
		onError,
		fallback,
		displayMode = "cover",
		borderRadius,
		className,
		attributes,
		imageAttributes,
	} = props;
	const [status, setStatus] = React.useState("loading");
	const baseClassNames = classNames(
		s.root,
		borderRadius && s[`--radius-${borderRadius}`],
		displayMode && s[`--display-mode-${displayMode}`],
		className
	);
	const imgClassNames = classNames(s.image, baseClassNames);
	const fallbackClassNames = classNames(s.fallback, baseClassNames);
	const style = {
		...responsiveVariables("--_w", width),
		...responsiveVariables("--_h", height),
	} as React.CSSProperties;

	const handleLoad = (e: React.SyntheticEvent) => {
		setStatus("success");
		onLoad?.(e);
	};

	const handleError = (e: React.SyntheticEvent) => {
		setStatus("error");
		onError?.(e);
	};

	React.useEffect(() => {
		setStatus("loading");
	}, [src]);

	if ((status === "error" || !src) && !!fallback) {
		if (typeof fallback === "string") {
			return (
				<img
					{...attributes}
					src={fallback}
					alt={alt}
					role={alt ? undefined : "presentation"}
					className={fallbackClassNames}
					style={style}
				/>
			);
		}

		return (
			<div {...attributes} className={fallbackClassNames} style={style}>
				{fallback}
			</div>
		);
	}

	return (
		<img
			{...attributes}
			{...imageAttributes}
			src={src}
			alt={alt}
			role={alt ? undefined : "presentation"}
			onLoad={handleLoad}
			onError={handleError}
			className={imgClassNames}
			style={style}
		/>
	);
};

export default Image;
