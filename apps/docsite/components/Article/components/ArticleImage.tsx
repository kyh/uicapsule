import React from "react";
import { Image } from "reshaped";
import ArticleItem from "./ArticleItem";
import s from "../Article.module.css";

const ArticleImage = (props: { src: string; alt: string; bordered?: boolean }) => {
	const { src, alt, bordered } = props;

	return (
		<ArticleItem>
			<Image src={src} alt={alt} className={bordered && s.imageBordered} borderRadius="medium" />
		</ArticleItem>
	);
};

export default ArticleImage;
