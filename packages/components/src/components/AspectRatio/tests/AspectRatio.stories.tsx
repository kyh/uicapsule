import React from "react";
import { Example, Placeholder } from "utilities/storybook";
import AspectRatio from "components/AspectRatio";
import View from "components/View";

export default { title: "Utilities/AspectRatio" };

export const ratio = () => (
  <Example>
    <Example.Item title="ratio: 1/1">
      <View width="300px">
        <AspectRatio>
          <Placeholder h="100%" />
        </AspectRatio>
      </View>
    </Example.Item>

    <Example.Item title="ratio: 4/3">
      <View width="300px">
        <AspectRatio ratio={4 / 3}>
          <Placeholder h="100%" />
        </AspectRatio>
      </View>
    </Example.Item>
    <Example.Item title="ratio: 16/9">
      <View width="300px">
        <AspectRatio ratio={16 / 9}>
          <Placeholder h="100%" />
        </AspectRatio>
      </View>
    </Example.Item>

    <Example.Item title={["responsive ratio", "[s] 16/9", "[m+] 1/1"]}>
      <View width="300px">
        <AspectRatio ratio={{ s: 16 / 9, m: 1 / 1 }}>
          <Placeholder h="100%" />
        </AspectRatio>
      </View>
    </Example.Item>
  </Example>
);
