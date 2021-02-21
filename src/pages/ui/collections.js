import React from "react";
import Head from "next/head";
import DashboardLayout from "components/DashboardLayout";
import { requireAuth } from "util/auth.js";

const CollectionsPage = () => (
  <>
    <Head>
      <title>UI Capsule | My Capsule Collections</title>
    </Head>
    <p>Collections Page...</p>
  </>
);

CollectionsPage.Layout = DashboardLayout;

export default requireAuth(CollectionsPage);
