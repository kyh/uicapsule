import React from "react";
import Head from "next/head";
import FaqSection from "components/FaqSection";
import ContactSection from "components/ContactSection";

function ContactPage() {
  return (
    <>
      <Head>
        <title>UI Capsule | Contact</title>
      </Head>
      {/* <FaqSection
        bgColor="default"
        size="large"
        title="Frequently Asked Questions"
      /> */}
      <ContactSection
        bgColor="default"
        size="large"
        title="Got any feedback?"
        buttonText="Send message"
        buttonColor="primary"
      />
    </>
  );
}

export default ContactPage;
