import { Text } from "@uicapsule/components";
import ArticleItem from "./ArticleItem";
import s from "../Article.module.css";

const ArticleText = (props: { children: React.ReactNode }) => {
  const { children } = props;

  return (
    <ArticleItem as="p" className={s.paragraph}>
      <Text variant="body-1" as="span">
        {children}
      </Text>
    </ArticleItem>
  );
};

export default ArticleText;
