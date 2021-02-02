import React from "react";
import Head from "next/head";
import DashboardLayout from "components/DashboardLayout";
import DashboardSection from "components/DashboardSection";
import { requireAuth } from "util/auth.js";

function DashboardPage() {
  return (
    <>
      <Head>
        <title>UI Capsule | Dashboard</title>
      </Head>
      <DashboardSection />
    </>
  );
}

DashboardPage.Layout = DashboardLayout;

export default requireAuth(DashboardPage);
