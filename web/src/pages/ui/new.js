import SEO from "components/SEO";
import DashboardFullLayout from "components/DashboardFullLayout";
import UIDetailsEditSection from "components/UIDetailsEditSection";
import { requireAuth } from "actions/auth";

const NewUIPage = () => (
  <>
    <SEO title="New Capsule" />
    <UIDetailsEditSection />
  </>
);

NewUIPage.Layout = DashboardFullLayout;

export default requireAuth(NewUIPage);
