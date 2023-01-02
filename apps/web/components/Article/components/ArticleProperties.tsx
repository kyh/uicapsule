import ArticleItem from "./ArticleItem";
import { PropertiesTable, PropertiesTableProps } from "components/Properties";

const ArticleProperties = (props: Pick<PropertiesTableProps, "name">) => {
  const { name } = props;

  return (
    <ArticleItem>
      <PropertiesTable name={name} />
    </ArticleItem>
  );
};

export default ArticleProperties;
