import Link from "next/link";
import { Card, Icon, View, Text } from "@uicapsule/components";
import IconArrow from "icons/ArrowUpRight";

type Props = {
  title: string;
  href: string;
};

const ArticleCrossLink = (props: Props) => {
  const { title, href } = props;
  const isExternal = !href.startsWith("/");

  const renderLabel = () => {
    if (isExternal) return "External resource";
    if (href.includes("components")) return "Related component";
    if (href.includes("utilities")) return "Related utility";
    if (href.includes("guidelines")) return "Related guideline";
    return "Related article";
  };

  const renderCard = () => {
    return (
      <Card
        href={href}
        attributes={isExternal ? { target: "_blank" } : undefined}
        elevated
      >
        <View direction="row">
          <View.Item grow>
            <Text variant="body-strong-1">{title}</Text>
            <Text color="neutral-faded" variant="body-2">
              {renderLabel()}
            </Text>
          </View.Item>

          <Icon svg={IconArrow} size={5} />
        </View>
      </Card>
    );
  };

  if (isExternal) return renderCard();

  return (
    <Link href={href} passHref>
      {renderCard()}
    </Link>
  );
};

export default ArticleCrossLink;
