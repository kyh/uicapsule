import s from "../Article.module.css";

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
};

const ArticleItem = (props: Props) => {
  const { children, className, as: Tag = "div" } = props;
  const itemClassNames = `${s.item} ${className || ""}`;

  return <Tag className={itemClassNames}>{children}</Tag>;
};

export default ArticleItem;
