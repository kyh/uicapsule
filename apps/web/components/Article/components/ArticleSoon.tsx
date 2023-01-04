import { Button, Text, View, Card } from "@uicapsule/components";
import IconArrowRight from "icons/ArrowRight";
import ComponentPreview from "components/ComponentPreview";

const ArticleSoon = (props: { name: string }) => (
  <Card padding={0}>
    <ComponentPreview centered height={420}>
      <View align="center" gap={2}>
        <Text variant="title-2" align="center">
          Want to use {props.name} in your&nbsp;product?
        </Text>
        <Text variant="featured-3" align="center">
          Be the first to learn when it&apos;s shipped
        </Text>
        <View.Item gapBefore={6}>
          <Button
            href="http://newsletter.uicapsule.com"
            attributes={{ target: "_blank" }}
            color="primary"
            size="large"
            endIcon={IconArrowRight}
          >
            Get notified
          </Button>
        </View.Item>
      </View>
    </ComponentPreview>
  </Card>
);

export default ArticleSoon;
