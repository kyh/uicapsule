import React from "react";
import { useTheme } from "reshaped";

const useStoredColorMode = () => {
	const theme = useTheme();

	React.useEffect(() => {
		localStorage.setItem("__reshaped-mode", theme.colorMode);
	}, [theme.colorMode]);

	return theme;
};

export default useStoredColorMode;
