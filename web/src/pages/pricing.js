import SEO from "components/SEO";
import SiteLayout from "components/SiteLayout";
import PricingSection from "components/PricingSection";

const PricingPage = () => (
  <>
    <SEO title="Pricing" />
    <PricingSection />
  </>
);

PricingPage.Layout = SiteLayout;

export default PricingPage;
