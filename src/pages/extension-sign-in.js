import React, { useEffect } from "react";
import Head from "next/head";
import SiteLayout from "components/SiteLayout";
import HeroSection from "components/HeroSection";
import SectionHeader from "components/SectionHeader";
import { useAuth, requireAuth } from "util/auth";
import { sendNewToken } from "util/extension";
import { apiRequest } from "util/utils";

const ExtensionSignInPage = () => {
  const auth = useAuth();

  useEffect(async () => {
    const token = await apiRequest("firebase-custom-token", "POST", auth.user);
    sendNewToken(token);
  }, []);

  return (
    <>
      <Head>
        <title>UI Capsule | Extension Sign In</title>
      </Head>
      <HeroSection
        bgColor="default"
        size="large"
        pt={{ xs: 12, sm: 20 }}
        pb={{ xs: 6, sm: 8 }}
      >
        <SectionHeader
          title="You are now signed in"
          subtitle="Start bookmarking by clicking on your extension"
          size={2}
        />
      </HeroSection>
    </>
  );
};

ExtensionSignInPage.Layout = SiteLayout;

export default requireAuth(ExtensionSignInPage, true);
