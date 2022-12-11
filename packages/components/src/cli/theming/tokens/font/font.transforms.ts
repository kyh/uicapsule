import type * as T from "./font.types";
import type * as TViewport from "../viewport/viewport.types";
import { Transformer, TransformedToken } from "../types";
import { getVariableName } from "../../utilities/css";

const transformedToken: Transformer<T.Token> = (name, token) => {
	const result: TransformedToken[] = [];
	const viewports: TViewport.Name[] = ["s", "m", "l", "xl"];

	viewports.forEach((passedViewport, index) => {
		const viewport = passedViewport === "s" ? undefined : passedViewport;
		let responsiveToken = token;
		let viewportFallbackCounter = index;

		while (viewportFallbackCounter > -1) {
			let resolvedToken;
			const currentViewport = viewports[viewportFallbackCounter];

			if (currentViewport === "s") {
				resolvedToken = token;
			} else {
				resolvedToken = token.responsive && token.responsive[currentViewport];
			}

			if (resolvedToken) {
				responsiveToken = { ...token, ...resolvedToken };
				viewportFallbackCounter = -1;
			}

			viewportFallbackCounter -= 1;
		}

		result.push({
			name,
			tokenType: "fontSize",
			type: "variable",
			value: `${responsiveToken.fontSize.px}px`,
			viewport,
		});

		result.push({
			name,
			tokenType: "lineHeight",
			type: "variable",
			value: `${responsiveToken.lineHeight.px}px`,
			viewport,
		});

		result.push({
			name,
			tokenType: "fontFamily",
			type: "variable",
			value: `var(${getVariableName(responsiveToken.fontFamilyToken, "fontFamily")})`,
			viewport,
		});

		result.push({
			name,
			tokenType: "fontWeight",
			type: "variable",
			value: `var(${getVariableName(responsiveToken.fontWeightToken, "fontWeight")})`,
			viewport,
		});
	});

	return result;
};

export default transformedToken;
