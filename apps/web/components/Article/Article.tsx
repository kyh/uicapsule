import React from "react";
import { MDXRemote } from "next-mdx-remote";
import CodeExample from "components/CodeExample";
import ArticleHeading from "./components/ArticleHeading";
import ArticleText from "./components/ArticleText";
import ArticleCode from "./components/ArticleCode";
import ArticleTable from "./components/ArticleTable";
import ArticleDivider from "./components/ArticleDivider";
import ArticleCrossLink from "./components/ArticleCrossLink";
import ArticleGrid from "./components/ArticleGrid";
import ArticleList from "./components/ArticleList";
import ArticleLink from "./components/ArticleLink";
import ArticleImage from "./components/ArticleImage";
import ArticleItem from "./components/ArticleItem";
import ArticleHighlight from "./components/ArticleHighlight";
import ArticleRelease from "./components/ArticleRelease";
import ArticleProperties from "./components/ArticleProperties";
import ArticleSoon from "./components/ArticleSoon";
import ArticleDemo from "./components/ArticleDemo";
import s from "./Article.module.css";

const components: Record<string, (props: any) => any> = {
  h1: (props: { children: string }) => (
    <ArticleHeading level={1}>{props.children}</ArticleHeading>
  ),
  h2: (props: { children: string }) => (
    <ArticleHeading level={2}>{props.children}</ArticleHeading>
  ),
  h3: (props: { children: string }) => (
    <ArticleHeading level={3}>{props.children}</ArticleHeading>
  ),
  h4: (props: { children: string }) => (
    <ArticleHeading level={4}>{props.children}</ArticleHeading>
  ),
  p: ArticleText,
  code: (props: any) => {
    if (!props.children.endsWith("\n")) {
      return <ArticleCode {...props} />;
    }

    return (
      <ArticleItem>
        <CodeExample {...props} />
      </ArticleItem>
    );
  },
  table: ArticleTable,
  td: ArticleTable.Td,
  th: ArticleTable.Th,
  hr: ArticleDivider,
  Image: ArticleImage,
  ul: ArticleList,
  li: ArticleList.Item,
  a: ArticleLink,
  Item: ArticleItem,
  CrossLink: ArticleCrossLink,
  Grid: ArticleGrid,
  Release: ArticleRelease,
  Highlight: ArticleHighlight,
  Props: ArticleProperties,
  Soon: ArticleSoon,
  Demo: ArticleDemo,
};

const Article = (props: { source: any }) => {
  const { source } = props;

  return (
    <div className={s.root}>
      <MDXRemote {...source} components={components} />
    </div>
  );
};

Article.Text = ArticleText;
Article.Item = ArticleItem;
export default Article;
