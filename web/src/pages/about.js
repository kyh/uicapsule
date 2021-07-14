import Head from "next/head";
import SiteLayout from "components/SiteLayout";
import HeroSection from "components/HeroSection";
import SectionHeader from "components/SectionHeader";
import CtaSection from "components/CtaSection";
import TextParagraph from "components/TextParagraph";
import TextList from "components/TextList";

const Content = () => (
  <>
    <TextParagraph>
      I'm a total bookmark nerd. Often times finding myself bookmarking things I
      think I'll need later on. Specifically, web pages I find beautiful,
      useful, and well designed. To me, these bookmarks provide great reference
      point when working on a new project to draw inspiration from.
    </TextParagraph>
    <TextParagraph>
      Over the years though, I've found that a traditional bookmark manager
      doesn't quite grant me the tools to resurface, identify, and organize the
      things I've saved.
    </TextParagraph>
    <TextParagraph>
      The issues, I think, can be divided into these few themes:
    </TextParagraph>
    <TextList>
      <li>
        <TextParagraph>
          Bookmarking an entire page seems a little too generic. What is it
          about this particular page did I find fascinating?
        </TextParagraph>
      </li>
      <li>
        <TextParagraph>
          As time goes by these bookmarks would become stale. A nightmare I
          think we've all experienced: the links stop working 😔
        </TextParagraph>
      </li>
      <li>
        <TextParagraph>
          If we're lucky our bookmark manager would also take a screenshot of
          the original source. However, screenshot resolutions may be poor and
          even worse yet, they're non interactive
        </TextParagraph>
      </li>
      <li>
        <TextParagraph>
          It's difficult to compose various bookmarks together in one single
          source, whether it be a moodboard or some other design artifact
        </TextParagraph>
      </li>
    </TextList>
    <TextParagraph>
      I built UI Capsule to try to tackle each of these problems. I describe it
      as <em>"Pinterest meets UI"</em>
    </TextParagraph>
    <TextParagraph>
      Hopefully, with the help of this tool, design hoarders like myself can
      continue our passion for collecting, without all the extra baggage.
    </TextParagraph>
  </>
);

const AboutPage = () => (
  <>
    <Head>
      <title>About</title>
    </Head>
    <HeroSection
      bgColor="default"
      size="large"
      pt={{ xs: 12, sm: 20 }}
      pb={{ xs: 6, sm: 8 }}
    >
      <SectionHeader
        title="Design hoarding"
        subtitle="without the bookmark debt"
        size={2}
      />
      <Content />
    </HeroSection>
    <CtaSection
      size="medium"
      title="Want to give it a try?"
      subtitle="Let's collect UI without all the extra baggage"
      buttonText="Get started for free"
      buttonPath="/auth/signup"
    />
  </>
);

AboutPage.Layout = SiteLayout;

export default AboutPage;
