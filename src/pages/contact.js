import React from "react";
import FaqSection from "components/FaqSection";
import ContactSection from "components/ContactSection";

function ContactPage() {
  return (
    <>
      <FaqSection
        bgColor="default"
        size="medium"
        title="Frequently Asked Questions"
      />
      <ContactSection
        bgColor="default"
        size="medium"
        title="Contact Us"
        buttonText="Send message"
        buttonColor="primary"
        showNameField
      />
    </>
  );
}

export default ContactPage;
