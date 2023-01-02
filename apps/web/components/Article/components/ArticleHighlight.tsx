import React from "react";
import { Text, Icon, View, TextProps } from "@uicapsule/components";
import IconCheckmark from "icons/Checkmark";
import ArticleItem from "./ArticleItem";
import s from "../Article.module.css";

const ArticleHighlight = (props: Pick<TextProps, "children">) => {
  return (
    <ArticleItem className={s.highlight}>
      <View direction="row" align="start" gap={3}>
        <Icon svg={IconCheckmark} color="primary" size={6} />
        <View.Item grow>
          <Text variant="body-1">{props.children}</Text>
        </View.Item>
      </View>
    </ArticleItem>
  );
};

export default ArticleHighlight;
