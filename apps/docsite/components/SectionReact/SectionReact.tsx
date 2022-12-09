import React from "react";
import { Container, Text, View, Icon, Badge } from "@uicapsule/components";
import CodeExample from "components/CodeExample";
import BlockReview from "components/BlockReview";
import BlockFeature from "components/BlockFeature";
import BlockVideo from "components/BlockVideo";
import IconArrowRight from "icons/ArrowRight";
import IconCheckmark from "icons/Checkmark";
import { reactDemoSrc } from "constants/vimeo";
import * as ga from "utilities/ga";
import s from "./SectionReact.module.css";

const SectionReact = () => {
  return (
    <Container width="1056px">
      <View gap={8}>
        <Container width="852px">
          <View gap={3}>
            <Text variant="display-3" align="center" as="h2">
              React library
            </Text>
            <Text variant="featured-3" align="center" as="p">
              More than 40 components, utilities and hooks for your product
              development
            </Text>
          </View>
        </Container>

        <View
          gap={{ s: 4, l: 5 }}
          direction={{ s: "column", m: "row" }}
          align="stretch"
        >
          <View.Item columns={{ s: 12, m: 6, l: 12 }}>
            <BlockFeature
              horizontal
              title="Compatible with your codebase"
              text="React is the only dependency Reshaped needs in runtime. You can use it alongside any other dependencies you already use in your product."
              action={{
                children: "Code examples",
                endIcon: IconArrowRight,
                href: "https://github.com/arcade-design/community/tree/master/examples",
                attributes: { target: "_blank" },
                onClick: () => {
                  ga.trackEvent({
                    category: ga.EventCategory.External,
                    action: "external_navigate_react_demo",
                  });
                },
              }}
            >
              <CodeExample className="language-tsx" mode="code" elevated>
                {`
<Card elevated>
	<View direction="row" gap={{ s: 2, l: 4 }}>
		<Avatar size={10} src="avatar.jpg" />

		<View.Item grow>
			<Text variant="body-medium-1">Reshaped</Text>
			<Text color="neutral-faded">
				Design system built for your scale
			</Text>
		</View.Item>

		<Button startIcon={IconArrow} rounded />
	</View>
</Card>
								`}
              </CodeExample>
            </BlockFeature>
          </View.Item>

          <View.Item columns={{ s: 12, m: 6, l: 4 }}>
            <BlockFeature
              autoHeightPreview
              title="Typescript support"
              text="Everything you import from Reshaped is written in Typescript. Code editor helps you writing code before you even open the documentation."
            >
              <img
                alt="Typescript support"
                src="/img/landing/react/typescript.webp"
                width="80%"
                className={s.ts}
              />
            </BlockFeature>
          </View.Item>
          <View.Item columns={{ s: 12, m: 6, l: 4 }}>
            <BlockFeature
              bleedPreview
              title="Tiny yet powerful"
              text="The whole React library weighs ~35kb including both CSS and JS code. Adopt it alongside your current codebase and your bundle will only have the parts you use."
            >
              <img
                alt="Small bundle size"
                src="/img/landing/react/size.webp"
                width="100%"
                className={s.size}
              />
            </BlockFeature>
          </View.Item>
          <View.Item columns={{ s: 12, m: 6, l: 4 }}>
            <BlockFeature
              title="Fully tested"
              text="Reshaped is covered with an extensive test suite of unit, screenshot and accessibility tests. You’ll get multiple hundreds of tests and we keep adding more."
            >
              <View gap={3} attributes={{ "aria-hidden": true }}>
                <View direction="row" align="center" gap={2}>
                  <Text variant="body-medium-1">Button.tsx</Text>
                  <Badge rounded color="positive" variant="outline">
                    Passed
                  </Badge>
                </View>

                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <View direction="row" gap={2} align="center" key={index}>
                    <Icon size={5} svg={IconCheckmark} color="positive" />
                    <View.Item grow>
                      <View
                        backgroundColor="neutral"
                        width={index % 2 ? "80%" : "70%"}
                        height="8px"
                        borderRadius="small"
                      />
                    </View.Item>
                  </View>
                ))}
              </View>
            </BlockFeature>
          </View.Item>

          <View.Item columns={{ s: 12, m: 6 }}>
            <BlockReview
              text="What I like about Reshaped is its incredible attention to details. Quality of the code I found in the package, setup for the complex components and focus on accessibility immediately got me excited about the project."
              avatarUrl="/img/landing/avatar-max.webp"
              name="Max Trusov"
              position="Head of Front-end Development"
              color="blue"
            />
          </View.Item>

          <View.Item columns={{ s: 12, m: 6 }}>
            <BlockVideo
              backgroundContain
              label="React video demo"
              previewSrc="/img/landing/react/video.webp"
              src={reactDemoSrc}
            />
          </View.Item>
        </View>
      </View>
    </Container>
  );
};

export default SectionReact;
