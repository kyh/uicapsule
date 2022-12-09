import React from "react";
import { classNames } from "utilities/helpers";
import useIsomorphicLayoutEffect from "hooks/useIsomorphicLayoutEffect";
import { ThemeContext } from "./Theme.context";
import { useTheme, useGlobalColorMode } from "./useTheme";
import * as T from "./Theme.types";
import s from "./Theme.module.css";

const ThemeProvider = (props: T.Props) => {
	const { theme, colorMode, children, className } = props;
	const globalColorMode = useGlobalColorMode();
	const parentTheme = useTheme();
	const isRootProvider = !parentTheme.theme;
	const usedTheme = theme || parentTheme.theme;
	const parentColorMode = isRootProvider ? globalColorMode : parentTheme.colorMode;
	const invertedColorMode = parentColorMode === "light" ? "dark" : "light";
	const usedColorMode = colorMode === "inverted" ? invertedColorMode : colorMode || parentColorMode;
	const themeAttribute = usedColorMode === "dark" ? `${usedTheme}-dark` : `${usedTheme}-light`;
	const rootClassNames = classNames(s.root, className);

	useIsomorphicLayoutEffect(() => {
		if (!document || !isRootProvider) return;
		document.body.setAttribute("data-rs-theme", themeAttribute);

		return () => {
			document.body.removeAttribute("data-rs-theme");
		};
	}, [usedColorMode, isRootProvider]);

	return (
		<ThemeContext.Provider
			value={{
				theme: usedTheme,
				colorMode: usedColorMode,
			}}
		>
			<div className={rootClassNames} data-rs-theme={themeAttribute}>
				{children}
			</div>
		</ThemeContext.Provider>
	);
};

export default ThemeProvider;
