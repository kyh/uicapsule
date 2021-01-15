import React from "react";
import PricingSection from "components/PricingSection";

function PricingPage(props) {
  return (
    <PricingSection
      bgColor="default"
      size="medium"
      bgImage=""
      bgImageOpacity={1}
      title="Pricing"
      subtitle="Choose the plan that makes sense for you. All plans include a 14-day free trial."
    />
  );
}

export default PricingPage;
