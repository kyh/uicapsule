import React from "react";
import Head from "next/head";
import DashboardLayout from "components/DashboardLayout";
import { requireAuth } from "util/auth.js";

const FollowingPage = () => {
  return (
    <>
      <Head>
        <title>People I follow</title>
      </Head>
      <p>Following Page...</p>
    </>
  );
};

FollowingPage.Layout = DashboardLayout;

export default requireAuth(FollowingPage);
