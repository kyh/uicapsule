import React from "react";
import Head from "next/head";
import SiteLayout from "components/SiteLayout";
import HeroSection from "components/HeroSection";
import SectionHeader from "components/SectionHeader";
import TextHeader from "components/TextHeader";
import TextParagraph from "components/TextParagraph";
import TextList from "components/TextList";

const Content = () => (
  <>
    <TextParagraph>
      By downloading or using the app, these terms will automatically apply to
      you – you should make sure therefore that you read them carefully before
      using the app. You’re not allowed to copy, or modify the app, any part of
      the app, or our trademarks in any way. You’re not allowed to attempt to
      extract the source code of the app, and you also shouldn’t try to
      translate the app into other languages, or make derivative versions. The
      app itself, and all the trade marks, copyright, database rights and other
      intellectual property rights related to it, still belong to Kaiyu Hsu.
    </TextParagraph>
    <TextParagraph>
      Kaiyu Hsu is committed to ensuring that the app is as useful and efficient
      as possible. For that reason, we reserve the right to make changes to the
      app or to charge for its services, at any time and for any reason. We will
      never charge you for the app or its services without making it very clear
      to you exactly what you’re paying for.
    </TextParagraph>
    <TextParagraph>
      The UI Capsule app stores and processes personal data that you have
      provided to us, in order to provide my Service. It’s your responsibility
      to keep your phone and access to the app secure. We therefore recommend
      that you do not jailbreak or root your phone, which is the process of
      removing software restrictions and limitations imposed by the official
      operating system of your device. It could make your phone vulnerable to
      malware/viruses/malicious programs, compromise your phone’s security
      features and it could mean that the UI Capsule app won’t work properly or
      at all.
    </TextParagraph>
    <TextParagraph>
      The app does use third party services that declare their own Terms and
      Conditions.
    </TextParagraph>
    <TextParagraph>
      Link to Terms and Conditions of third party service providers used by the
      app
    </TextParagraph>
    <TextList>
      <li>
        <a
          href="https://firebase.google.com/terms/analytics"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Analytics for Firebase
        </a>
      </li>
      <li>
        <a
          href="https://firebase.google.com/terms/crashlytics"
          target="_blank"
          rel="noopener noreferrer"
        >
          Firebase Crashlytics
        </a>
      </li>
    </TextList>
    <TextParagraph>
      You should be aware that there are certain things that Kaiyu Hsu will not
      take responsibility for. Certain functions of the app will require the app
      to have an active internet connection. The connection can be Wi-Fi, or
      provided by your mobile network provider, but Kaiyu Hsu cannot take
      responsibility for the app not working at full functionality if you don’t
      have access to Wi-Fi, and you don’t have any of your data allowance left.
    </TextParagraph>
    <TextParagraph>
      If you’re using the app outside of an area with Wi-Fi, you should remember
      that your terms of the agreement with your mobile network provider will
      still apply. As a result, you may be charged by your mobile provider for
      the cost of data for the duration of the connection while accessing the
      app, or other third party charges. In using the app, you’re accepting
      responsibility for any such charges, including roaming data charges if you
      use the app outside of your home territory (i.e. region or country)
      without turning off data roaming. If you are not the bill payer for the
      device on which you’re using the app, please be aware that we assume that
      you have received permission from the bill payer for using the app.
    </TextParagraph>
    <TextParagraph>
      Along the same lines, Kaiyu Hsu cannot always take responsibility for the
      way you use the app i.e. You need to make sure that your device stays
      charged – if it runs out of battery and you can’t turn it on to avail the
      Service, Kaiyu Hsu cannot accept responsibility.
    </TextParagraph>
    <TextParagraph>
      With respect to Kaiyu Hsu’s responsibility for your use of the app, when
      you’re using the app, it’s important to bear in mind that although we
      endeavour to ensure that it is updated and correct at all times, we do
      rely on third parties to provide information to us so that we can make it
      available to you. Kaiyu Hsu accepts no liability for any loss, direct or
      indirect, you experience as a result of relying wholly on this
      functionality of the app.
    </TextParagraph>
    <TextParagraph>
      At some point, we may wish to update the app. The app is currently
      available on iOS – the requirements for system (and for any additional
      systems we decide to extend the availability of the app to) may change,
      and you’ll need to download the updates if you want to keep using the app.
      Kaiyu Hsu does not promise that it will always update the app so that it
      is relevant to you and/or works with the iOS version that you have
      installed on your device. However, you promise to always accept updates to
      the application when offered to you, We may also wish to stop providing
      the app, and may terminate use of it at any time without giving notice of
      termination to you. Unless we tell you otherwise, upon any termination,
      (a) the rights and licenses granted to you in these terms will end; (b)
      you must stop using the app, and (if needed) delete it from your device.
    </TextParagraph>
    <TextHeader>Posting Content</TextHeader>
    <TextParagraph>
      The following behaviors are expected and requested of all participants of
      UI Capsule:
    </TextParagraph>
    <TextList>
      <li>
        Participate in an authentic and active way. In doing so, you contribute
        to the health and longevity of this community.
      </li>
      <li>Exercise consideration and respect in your speech and actions.</li>
      <li>
        Refrain from demeaning, discriminatory, or harassing behavior and
        speech.
      </li>
      <li>
        Be mindful of your surroundings and of your fellow participants. Alert
        community leaders if you notice a dangerous situation, someone in
        distress, or violations of this Code of Conduct, even if they seem
        inconsequential.
      </li>
    </TextList>
    <TextParagraph>
      Remember that community event venues may be shared with members of the
      public; please be respectful to all patrons of these locations.
    </TextParagraph>
    <TextParagraph>
      The following behaviors are considered harassment and are unacceptable
      within our community:
    </TextParagraph>
    <TextList>
      <li>
        Violence, threats of violence or violent language directed against
        another person.
      </li>
      <li>
        Sexist, racist, homophobic, transphobic, ableist or otherwise
        discriminatory jokes and language.
      </li>
      <li>Posting or displaying sexually explicit or violent material.</li>
      <li>
        Posting or threatening to post other people’s personally identifying
        information ("doxing").
      </li>
      <li>
        Personal insults, particularly those related to gender, sexual
        orientation, race, religion, or disability.
      </li>
      <li>Inappropriate photography or recording.</li>
      <li>
        Unwelcome sexual attention. This includes, sexualized comments or jokes;
        inappropriate touching, groping, and unwelcomed sexual advances.
      </li>
      <li>
        Deliberate intimidation, stalking or following (online or in person).
      </li>
      <li>Advocating for, or encouraging, any of the above behavior.</li>
    </TextList>
    <TextHeader>Changes to This Terms and Conditions</TextHeader>
    <TextParagraph>
      I may update our Terms and Conditions from time to time. Thus, you are
      advised to review this page periodically for any changes. I will notify
      you of any changes by posting the new Terms and Conditions on this page.
    </TextParagraph>
    <TextParagraph>
      <small>These terms and conditions are effective as of 2021-04-15</small>
    </TextParagraph>
    <TextHeader>Contact Us</TextHeader>
    <TextParagraph>
      If you have any questions or suggestions about my Terms and Conditions, do
      not hesitate to contact me at im.kaiyu@gmail.com.
    </TextParagraph>
  </>
);

const TermsPage = () => (
  <>
    <Head>
      <title>Terms of use</title>
    </Head>
    <HeroSection
      bgColor="default"
      size="large"
      pt={{ xs: 12, sm: 20 }}
      pb={{ xs: 6, sm: 8 }}
    >
      <SectionHeader
        title="Terms of Use"
        subtitle="For our protection"
        size={2}
      />
      <Content />
    </HeroSection>
  </>
);

TermsPage.Layout = SiteLayout;

export default TermsPage;
