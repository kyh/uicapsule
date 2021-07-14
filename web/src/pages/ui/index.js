import Head from "next/head";
import DashboardLayout from "components/DashboardLayout";
import DashboardSection from "components/DashboardSection";
import { requireAuth } from "actions/auth";

const UIPage = () => {
  return (
    <>
      <Head>
        <title>My Saved Capsules</title>
      </Head>
      <DashboardSection />
    </>
  );
};

UIPage.Layout = DashboardLayout;

export default requireAuth(UIPage);
