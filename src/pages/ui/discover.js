import React from "react";
import Head from "next/head";
import DashboardLayout from "components/DashboardLayout";
import DashboardSection from "components/DashboardSection";
import { requireAuth } from "util/auth.js";

const DiscoverPage = () => {
  return (
    <>
      <Head>
        <title>UI Capsule | Discover Capsules</title>
      </Head>
      <DashboardSection section="discover" />
    </>
  );
};

DiscoverPage.Layout = DashboardLayout;

export default requireAuth(DiscoverPage);
