import SEO from "components/SEO";
import DashboardLayout from "components/DashboardLayout";
import DashboardSection from "components/DashboardSection";
import { requireAuth } from "actions/auth";

const UIPage = () => {
  return (
    <>
      <SEO title="Saved Capsules" />
      <DashboardSection />
    </>
  );
};

UIPage.Layout = DashboardLayout;

export default requireAuth(UIPage);
