import React from "react";
import { View, Text, Avatar } from "@uicapsule/components";
import * as T from "./BlockReview.types";
import s from "./BlockReview.module.css";

const BlockReview = (props: T.Props) => {
  const { text, name, position, avatarUrl, color } = props;
  const rootClassNames = s.root + (color ? ` ${s[`--color-${color}`]}` : "");

  return (
    <div className={rootClassNames}>
      <View height="100%" gap={{ s: 6, l: 10 }}>
        <Text variant="featured-3">“{text}“</Text>
        <View direction="row" align="center" gap={2}>
          <Avatar size={12} src={avatarUrl} alt={`${name} avatar`} />
          <View.Item grow>
            <Text variant="body-strong-2">{name}</Text>
            <Text variant="body-medium-2">{position}</Text>
          </View.Item>
        </View>
      </View>
    </div>
  );
};

export default BlockReview;
