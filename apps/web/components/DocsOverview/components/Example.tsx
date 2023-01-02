import React from "react";
import NextLink from "next/link";
import { Card, View, Text, Badge } from "@uicapsule/components";
import ComponentPreview from "components/ComponentPreview";
import s from "../DocsOverview.module.css";

type Props = {
  children?: React.ReactNode;
  title: string;
  text: string;
  href: string;
  soon?: boolean;
};

const Example = (props: Props) => {
  const { href, children, title, text, soon } = props;

  return (
    <NextLink href={href} passHref>
      <Card padding={0} className={s.card}>
        {children && (
          <ComponentPreview height={156} interactive={false} centered>
            {children}
          </ComponentPreview>
        )}
        <View padding={[3, 4]} gap={1}>
          <View direction="row" align="center">
            <View.Item grow>
              <Text variant="body-medium-2">{title}</Text>
            </View.Item>
            {soon && (
              <Badge size="small" variant="outline">
                Soon
              </Badge>
            )}
          </View>
          <Text variant="caption-1" color="neutral-faded" maxLines={2}>
            {text}
          </Text>
        </View>
      </Card>
    </NextLink>
  );
};

export default Example;
