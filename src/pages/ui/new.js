import React from "react";
import Head from "next/head";
import DashboardFullLayout from "components/DashboardFullLayout";
import UIDetailsSection from "components/UIDetailsSection";
import { requireAuth } from "util/auth.js";

const NewUIPage = () => (
  <>
    <Head>
      <title>UI Capsule | New</title>
    </Head>
    <UIDetailsSection />
  </>
);

NewUIPage.Layout = DashboardFullLayout;

export default requireAuth(NewUIPage);
