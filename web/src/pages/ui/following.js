import Head from "next/head";
import DashboardLayout from "components/DashboardLayout";
import { requireAuth } from "actions/auth";

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
