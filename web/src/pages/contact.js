import SEO from "components/SEO";
import SiteLayout from "components/SiteLayout";
import ContactSection from "components/ContactSection";

const ContactPage = () => (
  <>
    <SEO title="Contact" />
    <ContactSection
      bgColor="default"
      size="large"
      title="Got any feedback?"
      buttonText="Send message"
      buttonColor="primary"
    />
  </>
);

ContactPage.Layout = SiteLayout;

export default ContactPage;
