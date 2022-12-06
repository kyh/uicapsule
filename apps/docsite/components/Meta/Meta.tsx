import React from "react";
import Head from "next/head";

const Meta = (props: {
	title?: string;
	description?: string;
	titleEnding?: string;
	image?: string;
}) => {
	const { title, titleEnding, description, image } = props;
	const titleBase = "Reshaped";
	const shareTitle = [title, titleBase, titleEnding].filter(Boolean).join(" - ");

	return (
		<Head>
			{shareTitle && <title key="title">{shareTitle}</title>}
			{shareTitle && <meta name="twitter:title" content={shareTitle} />}
			{shareTitle && <meta property="og:title" content={shareTitle} />}
			{description && <meta name="description" content={description} />}
			{description && <meta property="og:description" content={description} />}
			{description && <meta name="twitter:description" content={description} />}
			{image && <meta name="image" content={`https://reshaped.so${image}`} />}
			{image && <meta name="twitter:image" content={`https://reshaped.so${image}`} />}
			{image && <meta property="og:image" content={`https://reshaped.so${image}`} />}
		</Head>
	);
};

export default Meta;
