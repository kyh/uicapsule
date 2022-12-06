import React from "react";

export type ItemProps = {
	children: React.ReactNode;
	className?: string;
	as?: keyof JSX.IntrinsicElements;
};

export type ExampleProps = {
	children: string;
	className?: string;
};

export type CrossLinkProps = {
	href: string;
	title: string;
};

export type Props = {
	children: React.ReactNode;
};
