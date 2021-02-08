import React from "react";
import Head from "next/head";
import SiteLayout from "components/SiteLayout";
import PricingSection from "components/PricingSection";

const PricingPage = () => (
  <>
    <Head>
      <title>UI Capsule | Pricing</title>
    </Head>
    <PricingSection />
  </>
);

PricingPage.Layout = SiteLayout;

export default PricingPage;
