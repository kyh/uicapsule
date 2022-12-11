import React from "react";
import { View, Avatar } from "@uicapsule/components";
import IconZap from "icons/Zap";
import Example from "./Example";

const ExampleAvatar = () => (
  <Example
    title="Avatar"
    text="Thumbnail of a user photo, organization, or a visual representation of other types of content"
    href="/content/docs/components/avatar"
  >
    <View direction="row" align="center" gap={3}>
      <Avatar src="/img/landing/author.webp" initials="D" />
      <Avatar initials="RS" color="primary" />
      <Avatar icon={IconZap} squared color="neutral" />
    </View>
  </Example>
);

export default ExampleAvatar;
