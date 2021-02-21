import React from "react";
import Head from "next/head";
import DashboardLayout from "components/DashboardLayout";
import { requireAuth } from "util/auth.js";

const CapsulePage = ({ title }) => (
  <>
    <Head>
      <title>UI Capsule | {title || "Untitled Capsule"}</title>
    </Head>
    <p>Capsule Page...</p>
  </>
);

CapsulePage.Layout = DashboardLayout;

export default requireAuth(CapsulePage);
