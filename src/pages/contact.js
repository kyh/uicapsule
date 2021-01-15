import React from "react";
import ContactSection from "components/ContactSection";

function ContactPage(props) {
  return (
    <ContactSection
      bgColor="default"
      size="medium"
      bgImage=""
      bgImageOpacity={1}
      title="Contact Us"
      subtitle=""
      buttonText="Send message"
      buttonColor="primary"
      showNameField={true}
    />
  );
}

export default ContactPage;
