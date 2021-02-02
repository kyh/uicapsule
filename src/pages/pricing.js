import React from "react";
import Head from "next/head";
import SiteLayout from "components/SiteLayout";
import PricingSection from "components/PricingSection";

function PricingPage() {
  return (
    <>
      <Head>
        <title>UI Capsule | Pricing</title>
      </Head>
      <PricingSection />
    </>
  );
}

PricingPage.Layout = SiteLayout;

export default PricingPage;
