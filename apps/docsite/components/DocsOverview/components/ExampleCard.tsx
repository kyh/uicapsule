import React from "react";
import { View, Button, Text, Image, Card } from "@uicapsule/components";
import Example from "./Example";

const ExampleCard = () => (
  <Example
    title="Card"
    text="Container to group information about subjects and their related actions"
    href="/content/docs/components/card"
  >
    <View
      width="240px"
      maxWidth="100%"
      attributes={{ style: { marginTop: -100 } }}
    >
      <Card padding={3}>
        <View gap={3}>
          <Image
            width="100%"
            src="/img/examples/nft.webp"
            borderRadius="medium"
            alt="Artwork preview"
          />
          <View direction="row" align="center" gap={3}>
            <View.Item grow>
              <Text variant="body-medium-2">0.74 ETH</Text>
            </View.Item>
            <Button variant="outline">Make a bid</Button>
          </View>
        </View>
      </Card>
    </View>
  </Example>
);

export default ExampleCard;
