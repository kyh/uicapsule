import React from "react";
import Head from "next/head";
import DashboardSection from "components/DashboardSection";
import { requireAuth } from "util/auth.js";

function DashboardPage(props) {
  return (
    <>
      <Head>
        <title>UI Capsule | Dashboard</title>
      </Head>
      <DashboardSection />
    </>
  );
}

export default requireAuth(DashboardPage);
