import React from "react";
import { Text, TextProps, Actionable, Icon } from "reshaped";
import { getHeadingId } from "utilities/md";
import IconLink from "icons/Link";
import ArticleItem from "./ArticleItem";
import s from "../Article.module.css";

type Props = {
	children: string;
	level: 1 | 2 | 3 | 4;
};

const map: Record<
	Props["level"],
	Pick<TextProps<"h1" | "h2" | "h3" | "span">, "variant" | "as" | "color">
> = {
	1: { variant: "display-3", as: "h1" },
	2: { variant: "title-3", as: "h2" },
	3: { variant: "body-strong-1", as: "h3" },
	4: { variant: "body-2", as: "span", color: "neutral-faded" },
};

const ArticleHeading = (props: Props) => {
	const { children, level } = props;
	const textProps = map[level];
	const className = `${s.heading} ${s[`heading--level-${level}`]}`;
	const id = getHeadingId(children);
	const hasLink = level < 4 && level > 1;

	return (
		<ArticleItem className={className}>
			<div className={s.headingAnchor} id={id} />

			{hasLink ? (
				<Actionable href={`#${id}`} className={s.headingWrapper}>
					<Text {...textProps}>
						{children}
						<Icon color="neutral-faded" svg={IconLink} size={6 - level} className={s.headingLink} />
					</Text>
				</Actionable>
			) : (
				<Text {...textProps}>{children}</Text>
			)}
		</ArticleItem>
	);
};

export default ArticleHeading;
