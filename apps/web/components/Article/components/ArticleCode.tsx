import s from "../Article.module.css";

const ArticleCode = (props: { children: React.ReactNode }) => {
  const { children } = props;

  return <span className={s.inlineCode}>{children}</span>;
};

export default ArticleCode;
