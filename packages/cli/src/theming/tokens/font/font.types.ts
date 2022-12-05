import type * as TUnit from "../unit/unit.types";
import type * as TFontWeight from "../fontWeight/fontWeight.types";
import type * as TFontFamily from "../fontFamily/fontFamily.types";
import type * as TViewport from "../viewport/viewport.types";

export type Name =
	| "display1"
	| "display2"
	| "display3"
	| "featured1"
	| "featured2"
	| "featured3"
	| "title1"
	| "title2"
	| "title3"
	| "bodyStrong1"
	| "bodyStrong2"
	| "bodyMedium1"
	| "bodyMedium2"
	| "body1"
	| "body2"
	| "caption1"
	| "caption2";

export type TokenBase = {
	fontSize: TUnit.Token;
	lineHeight: TUnit.Token;
	fontWeightToken: TFontWeight.Name;
	fontFamilyToken: TFontFamily.Name;
};

type FontViewport = TViewport.Name;

export type Token = TokenBase & {
	responsive?: Partial<Record<FontViewport, Partial<TokenBase>>>;
};

type ResolvedTokenForViewport = Pick<Token, "fontSize" | "lineHeight"> & {
	fontWeight: TFontWeight.Token;
	fontFamily: TFontFamily.Token;
};

export type ResolvedToken = ResolvedTokenForViewport & {
	responsive?: Partial<Record<TViewport.Name, Partial<ResolvedTokenForViewport>>>;
};
