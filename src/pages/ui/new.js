import React from "react";
import Head from "next/head";
import DashboardFullLayout from "components/DashboardFullLayout";
import UIDetailsEditSection from "components/UIDetailsEditSection";
import { requireAuth } from "util/auth.js";

const NewUIPage = () => (
  <>
    <Head>
      <title>UI Capsule | New</title>
    </Head>
    <UIDetailsEditSection />
  </>
);

NewUIPage.Layout = DashboardFullLayout;

export default requireAuth(NewUIPage);
