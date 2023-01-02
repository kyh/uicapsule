import { Text } from "@uicapsule/components";
import ArticleItem from "./ArticleItem";
import s from "../Article.module.css";

type Props = {
  children: React.ReactNode;
};

const ArticleList = (props: Props) => {
  const { children } = props;

  return (
    <ArticleItem className={s.listRoot}>
      <ul className={s.list}>{children}</ul>
    </ArticleItem>
  );
};

const ArticleListItem = (props: Props) => {
  return (
    <Text variant="body-1" className={s.listItem} as="li">
      {props.children}
    </Text>
  );
};

ArticleList.Item = ArticleListItem;
export default ArticleList;
