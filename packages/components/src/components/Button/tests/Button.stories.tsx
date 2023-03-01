import React from "react";
import { Example, Placeholder } from "utilities/storybook";
import Button from "components/Button";
import AspectRatio from "components/_deprecated/AspectRatio";
import View from "components/View";
import Image from "components/Image";
import IconZap from "icons/Zap";

export default { title: "Components/Button" };

const imgUrl =
  "https://images.unsplash.com/photo-1632502361954-0dd92ce797db?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1625&q=80";

export const variant = () => (
  <Example>
    <Example.Item title="variant: solid">
      <Button onClick={() => {}}>Button</Button>
    </Example.Item>
    <Example.Item title="variant: outline">
      <Button onClick={() => {}} variant="outline">
        Button
      </Button>
    </Example.Item>
    <Example.Item title="variant: ghost">
      <Button onClick={() => {}} variant="ghost">
        Button
      </Button>
    </Example.Item>
  </Example>
);

export const color = () => (
  <Example>
    <Example.Item title="color: primary, all variants">
      <View gap={3} direction="row">
        <Button color="primary">Button</Button>
        <Button color="primary" variant="outline">
          Button
        </Button>
        <Button color="primary" variant="ghost">
          Button
        </Button>
      </View>
    </Example.Item>
    <Example.Item title="color: critical, all variants">
      <View gap={3} direction="row">
        <Button color="critical">Button</Button>
        <Button color="critical" variant="outline">
          Button
        </Button>
        <Button color="critical" variant="ghost">
          Button
        </Button>
      </View>
    </Example.Item>

    <Example.Item title="color: positive, all variants">
      <View gap={3} direction="row">
        <Button color="positive">Button</Button>
        <Button color="positive" variant="outline">
          Button
        </Button>
        <Button color="positive" variant="ghost">
          Button
        </Button>
      </View>
    </Example.Item>

    <Example.Item
      title={["color: inherit, variant: ghost", "renders as white"]}
    >
      <View padding={4} backgroundColor="primary" borderRadius="small">
        <Button color="inherit" variant="ghost">
          Button
        </Button>
      </View>
    </Example.Item>

    <Example.Item
      title={[
        "color: inherit, variant: ghost",
        "renders as black in light mode",
        "renders as white in dark mode",
      ]}
    >
      <View padding={4} backgroundColor="neutral" borderRadius="small">
        <Button color="inherit" variant="ghost">
          Button
        </Button>
      </View>
    </Example.Item>
    <Example.Item title="color: black, variant: solid and ghost">
      <View
        padding={4}
        gap={3}
        direction="row"
        backgroundColor="white"
        borderRadius="small"
        borderColor="neutral-faded"
      >
        <Button color="black">Button</Button>
        {/* <Button color="black" variant="outline">
					Inherit
				</Button> */}
        <Button color="black" variant="ghost">
          Button
        </Button>
      </View>
    </Example.Item>
    <Example.Item title="color: white, variant: solid and ghost">
      <View
        padding={4}
        gap={3}
        direction="row"
        backgroundColor="black"
        borderRadius="small"
        borderColor="neutral-faded"
      >
        <Button color="white">Button</Button>
        {/* <Button color="white" variant="outline">
					Inherit
				</Button> */}
        <Button color="white" variant="ghost">
          Button
        </Button>
      </View>
    </Example.Item>
  </Example>
);

export const icon = () => (
  <Example>
    <Example.Item title="icon: start">
      <Button onClick={() => {}} startIcon={IconZap}>
        Button
      </Button>
    </Example.Item>
    <Example.Item title="icon: end">
      <Button onClick={() => {}} endIcon={IconZap}>
        Button
      </Button>
    </Example.Item>

    <Example.Item title="icon: start and end">
      <Button onClick={() => {}} startIcon={IconZap} endIcon={IconZap}>
        Button
      </Button>
    </Example.Item>

    <Example.Item title="icon only">
      <Button onClick={() => {}} startIcon={IconZap} />
    </Example.Item>
  </Example>
);

export const elevated = () => (
  <Example>
    <Example.Item title="color: neutral, elevated, variant: solid and outline">
      <View gap={3} direction="row">
        <Button elevated>Button</Button>
        <Button elevated variant="outline">
          Button
        </Button>
      </View>
    </Example.Item>
    <Example.Item title="color: primary, elevated, variant: solid and outline">
      <View gap={3} direction="row">
        <Button elevated color="primary">
          Button
        </Button>
        <Button elevated variant="outline" color="primary">
          Button
        </Button>
      </View>
    </Example.Item>

    <Example.Item title="color: white, elevated, variant: solid">
      <View gap={3} backgroundColor="primary-faded" padding={2} direction="row">
        <Button color="white" elevated>
          Button
        </Button>
      </View>
    </Example.Item>

    <Example.Item title="color: black, elevated, variant: solid">
      <View gap={3} backgroundColor="primary-faded" padding={2} direction="row">
        <Button color="black" elevated>
          Button
        </Button>
      </View>
    </Example.Item>
  </Example>
);

export const size = () => (
  <Example>
    <Example.Item title="size: small, all variants">
      <View gap={3} direction="row">
        <Button size="small" startIcon={IconZap}>
          Button
        </Button>
        <Button size="small" variant="outline" startIcon={IconZap}>
          Button
        </Button>
        <Button size="small" variant="ghost" startIcon={IconZap}>
          Button
        </Button>
      </View>
    </Example.Item>

    <Example.Item title="size: medium, all variants">
      <View gap={3} direction="row">
        <Button startIcon={IconZap}>Button</Button>
        <Button variant="outline" startIcon={IconZap}>
          Button
        </Button>
        <Button variant="ghost" startIcon={IconZap}>
          Button
        </Button>
      </View>
    </Example.Item>

    <Example.Item title="size: large, all variants">
      <View gap={3} direction="row">
        <Button size="large" startIcon={IconZap}>
          Button
        </Button>
        <Button size="large" variant="outline" startIcon={IconZap}>
          Button
        </Button>
        <Button size="large" variant="ghost" startIcon={IconZap}>
          Button
        </Button>
      </View>
    </Example.Item>

    <Example.Item title="size: xlarge, all variants">
      <View gap={3} direction="row">
        <Button size="xlarge" startIcon={IconZap}>
          Button
        </Button>
        <Button size="xlarge" variant="outline" startIcon={IconZap}>
          Button
        </Button>
        <Button size="xlarge" variant="ghost" startIcon={IconZap}>
          Button
        </Button>
      </View>
    </Example.Item>

    <Example.Item title={["responsive size", "[s] large", "[m+] medium"]}>
      <Button size={{ s: "large", m: "medium" }} startIcon={IconZap}>
        Button
      </Button>
    </Example.Item>
  </Example>
);

export const rounded = () => (
  <Example>
    <Example.Item title="rounded, size: small, all variants">
      <View gap={3} direction="row">
        <Button rounded size="small" icon={IconZap}>
          Button
        </Button>
        <Button rounded variant="outline" size="small" icon={IconZap}>
          Button
        </Button>
        <Button rounded variant="ghost" size="small" icon={IconZap}>
          Button
        </Button>
      </View>
    </Example.Item>
    <Example.Item title="rounded, size: medium, all variants">
      <View gap={3} direction="row">
        <Button rounded icon={IconZap}>
          Button
        </Button>
        <Button rounded variant="outline" icon={IconZap}>
          Button
        </Button>
        <Button rounded variant="ghost" icon={IconZap}>
          Button
        </Button>
      </View>
    </Example.Item>
    <Example.Item title="rounded, size: large, all variants">
      <View gap={3} direction="row">
        <Button rounded size="large" icon={IconZap}>
          Button
        </Button>
        <Button rounded variant="outline" size="large" icon={IconZap}>
          Button
        </Button>
        <Button rounded variant="ghost" size="large" icon={IconZap}>
          Button
        </Button>
      </View>
    </Example.Item>
    <Example.Item title="rounded, icon only, all sizes">
      <View gap={3} direction="row">
        <Button rounded size="small" startIcon={IconZap} />
        <Button rounded startIcon={IconZap} />
        <Button rounded size="large" startIcon={IconZap} />
      </View>
    </Example.Item>
  </Example>
);

export const fullWidth = () => (
  <Example>
    <Example.Item title="fullWidth, all variants">
      <View gap={3}>
        <Button fullWidth>Neutral</Button>
        <Button fullWidth variant="outline">
          Neutral
        </Button>
        <Button fullWidth variant="ghost">
          Neutral
        </Button>
      </View>
    </Example.Item>

    <Example.Item title={["responsive fullWidth", "[s] true", "[m+] false"]}>
      <Button fullWidth={{ s: true, m: false }}>Button</Button>
    </Example.Item>
  </Example>
);

export const loading = () => (
  <Example>
    <Example.Item title="loading, color: neutral, all variants">
      <View gap={3} direction="row">
        <Button loading>Button</Button>
        <Button loading variant="outline">
          Button
        </Button>
        <Button loading variant="ghost">
          Button
        </Button>
      </View>
    </Example.Item>
    <Example.Item title="loading, color critical, all variants">
      <View gap={3} direction="row">
        <Button loading color="critical">
          Button
        </Button>
        <Button loading color="critical" variant="outline">
          Button
        </Button>
        <Button loading color="critical" variant="ghost">
          Button
        </Button>
      </View>
    </Example.Item>
    <Example.Item title="loading, color positive, all variants">
      <View gap={3} direction="row">
        <Button loading color="positive">
          Button
        </Button>
        <Button loading color="positive" variant="outline">
          Button
        </Button>
        <Button loading color="positive" variant="ghost">
          Button
        </Button>
      </View>
    </Example.Item>

    <Example.Item title="loading, color: black and white">
      <AspectRatio ratio={16 / 9}>
        <Image src={imgUrl} />

        <div style={{ position: "absolute", top: 16, left: 16 }}>
          <View gap={3} direction="row">
            <Button color="black" loading>
              Button
            </Button>
            <Button color="white" loading>
              Button
            </Button>
            <Button color="white" variant="ghost" loading>
              Button
            </Button>
          </View>
        </div>
      </AspectRatio>
    </Example.Item>

    <Example.Item
      title={["loading, long button text", "button size should stay the same"]}
    >
      <Button loading color="primary">
        Long button text
      </Button>
    </Example.Item>

    <Example.Item
      title={["loading, icon only", "button keep square 1/1 ratio"]}
    >
      <Button startIcon={IconZap} rounded loading />
    </Example.Item>
  </Example>
);

export const highlighted = () => (
  <Example>
    <Example.Item title="highlighted, color: neutral, all variants">
      <View gap={3} direction="row">
        <Button highlighted icon={IconZap}>
          Button
        </Button>
        <Button highlighted variant="outline" icon={IconZap}>
          Button
        </Button>
        <Button highlighted variant="ghost" icon={IconZap}>
          Button
        </Button>
      </View>
    </Example.Item>
    <Example.Item title="highlighted, color: critical, all variants">
      <View gap={3} direction="row">
        <Button highlighted color="critical" icon={IconZap}>
          Button
        </Button>
        <Button highlighted color="critical" variant="outline" icon={IconZap}>
          Button
        </Button>
        <Button highlighted color="critical" variant="ghost" icon={IconZap}>
          Button
        </Button>
      </View>
    </Example.Item>
    <Example.Item title="highlighted, color: positive, all variants">
      <View gap={3} direction="row">
        <Button highlighted color="positive" icon={IconZap}>
          Button
        </Button>
        <Button highlighted color="positive" variant="outline" icon={IconZap}>
          Button
        </Button>
        <Button highlighted color="positive" variant="ghost" icon={IconZap}>
          Button
        </Button>
      </View>
    </Example.Item>
  </Example>
);

export const disabled = () => (
  <Example>
    <Example.Item title="disabled, color: neutral, all variants">
      <View gap={3} direction="row">
        <Button disabled icon={IconZap}>
          Button
        </Button>
        <Button disabled variant="outline" icon={IconZap}>
          Button
        </Button>
        <Button disabled variant="ghost" icon={IconZap}>
          Button
        </Button>
      </View>
    </Example.Item>
    <Example.Item title="disabled, color: critical, all variants">
      <View gap={3} direction="row">
        <Button disabled color="critical" icon={IconZap}>
          Button
        </Button>
        <Button disabled color="critical" variant="outline" icon={IconZap}>
          Button
        </Button>
        <Button disabled color="critical" variant="ghost" icon={IconZap}>
          Button
        </Button>
      </View>
    </Example.Item>
    <Example.Item title="disabled, color: positive, all variants">
      <View gap={3} direction="row">
        <Button disabled color="positive" icon={IconZap}>
          Button
        </Button>
        <Button disabled color="positive" variant="outline" icon={IconZap}>
          Button
        </Button>
        <Button disabled color="positive" variant="ghost" icon={IconZap}>
          Button
        </Button>
      </View>
    </Example.Item>

    <Example.Item title="disabled, color: black and white">
      <AspectRatio ratio={16 / 9}>
        <Image src={imgUrl} />

        <div style={{ position: "absolute", top: 16, left: 16 }}>
          <View gap={3} direction="row">
            <Button color="black" disabled>
              Button
            </Button>
            <Button color="white" disabled>
              Button
            </Button>
            <Button color="white" variant="ghost" disabled>
              Button
            </Button>
          </View>
        </div>
      </AspectRatio>
    </Example.Item>
  </Example>
);

export const aligner = () => (
  <Example>
    <Example.Item title="aligner: all">
      <View padding={4} borderColor="neutral-faded" direction="row" gap={2}>
        <View.Item grow>Content</View.Item>
        <Button.Aligner>
          <Button icon={IconZap} variant="ghost" />
        </Button.Aligner>
      </View>
    </Example.Item>

    <Example.Item title="aligner: top">
      <View padding={4} borderColor="neutral-faded" direction="row" gap={2}>
        <View.Item grow>
          <Placeholder />
        </View.Item>
        <Button.Aligner position="top">
          <Button icon={IconZap} variant="ghost" />
        </Button.Aligner>
      </View>
    </Example.Item>

    <Example.Item title="aligner: top and end">
      <View padding={4} borderColor="neutral-faded" direction="row" gap={2}>
        <View.Item grow>
          <Placeholder />
        </View.Item>
        <Button.Aligner position={["top", "end"]}>
          <Button icon={IconZap} variant="ghost" />
        </Button.Aligner>
      </View>
    </Example.Item>

    <Example.Item title="aligner: bottom">
      <View
        padding={4}
        borderColor="neutral-faded"
        direction="row"
        gap={2}
        align="end"
      >
        <View.Item grow>
          <Placeholder />
        </View.Item>
        <Button.Aligner position="bottom">
          <Button icon={IconZap} variant="ghost" />
        </Button.Aligner>
      </View>
    </Example.Item>

    <Example.Item title="aligner: start">
      <View padding={4} borderColor="neutral-faded" gap={2} align="start">
        <View.Item grow>
          <Placeholder />
        </View.Item>
        <Button.Aligner position="start">
          <Button icon={IconZap} variant="ghost" />
        </Button.Aligner>
      </View>
    </Example.Item>

    <Example.Item title="aligner: end">
      <View padding={4} borderColor="neutral-faded" gap={2} align="end">
        <View.Item grow>
          <Placeholder />
        </View.Item>
        <Button.Aligner position="end">
          <Button icon={IconZap} variant="ghost" />
        </Button.Aligner>
      </View>
    </Example.Item>
  </Example>
);
