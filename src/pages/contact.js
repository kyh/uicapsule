import React from "react";
import Head from "next/head";
import SiteLayout from "components/SiteLayout";
import ContactSection from "components/ContactSection";

const ContactPage = () => <>
  <Head>
    <title>UI Capsule | Contact</title>
  </Head>
  <ContactSection
    bgColor="default"
    size="large"
    title="Got any feedback?"
    buttonText="Send message"
    buttonColor="primary"
  />
</>;

ContactPage.Layout = SiteLayout;

export default ContactPage;
