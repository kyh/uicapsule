import React from "react";
import ArticleItem from "./ArticleItem";
import s from "../Article.module.css";

type Props = {
	children: React.ReactNode;
};

const ArticleTable = (props: Props) => {
	const { children } = props;

	return (
		<ArticleItem className={s.itemTable}>
			<table className={s.table}>{children}</table>
		</ArticleItem>
	);
};

const ArticleTd = (props: { children: React.ReactNode }) => {
	const { children } = props;

	return <td className={s.tableData}>{children}</td>;
};

const ArticleTh = (props: { children: React.ReactNode }) => {
	const { children } = props;

	return <th className={s.tableHeading}>{children}</th>;
};

ArticleTable.Td = ArticleTd;
ArticleTable.Th = ArticleTh;
export default ArticleTable;
