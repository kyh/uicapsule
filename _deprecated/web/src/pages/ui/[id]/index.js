import SEO from "components/SEO";
import { useRouter } from "next/router";
import DashboardFullLayout from "components/DashboardFullLayout";
import UIDetailsSection from "components/UIDetailsSection";
import { requireAuth } from "actions/auth";

const UIPage = () => {
  const router = useRouter();
  return (
    <>
      <SEO title="Capsule" />
      <UIDetailsSection id={router.query.id} />
    </>
  );
};

UIPage.Layout = DashboardFullLayout;

export default requireAuth(UIPage);
