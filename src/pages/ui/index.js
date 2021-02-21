import React from "react";
import Head from "next/head";
import DashboardLayout from "components/DashboardLayout";
import DashboardSection from "components/DashboardSection";
import { requireAuth } from "util/auth.js";

const UIPage = () => {
  return (
    <>
      <Head>
        <title>UI Capsule | My Saved Capsules</title>
      </Head>
      <DashboardSection section="saved" />
    </>
  );
};

UIPage.Layout = DashboardLayout;

export default requireAuth(UIPage);
