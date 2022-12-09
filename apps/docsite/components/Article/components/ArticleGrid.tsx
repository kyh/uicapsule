import React from "react";
import { View } from "@uicapsule/components";
import ArticleItem from "./ArticleItem";

const ArticleGrid = (props: { children: React.ReactNode; columns: 2 | 3 }) => {
  return (
    <ArticleItem>
      <View direction="row" gap={4}>
        {React.Children.map(props.children, (child: any) => {
          return (
            <View.Item
              columns={{ s: 12, m: 6, l: props.columns === 3 ? 4 : 6 }}
            >
              {child}
            </View.Item>
          );
        })}
      </View>
    </ArticleItem>
  );
};

export default ArticleGrid;
