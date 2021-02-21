import React from "react";
import Head from "next/head";
import DashboardLayout from "components/DashboardLayout";
import { requireAuth } from "util/auth.js";

const PlaygroundPage = () => (
  <>
    <Head>
      <title>UI Capsule | Playground</title>
    </Head>
    <p>Playground Page...</p>
  </>
);

PlaygroundPage.Layout = DashboardLayout;

export default requireAuth(PlaygroundPage);
