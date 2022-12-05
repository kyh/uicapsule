import SEO from "components/SEO";
import DashboardLayout from "components/DashboardLayout";
import { requireAuth } from "actions/auth";

const CollectionsPage = () => (
  <>
    <SEO title="Collections" />
    <p>Collections Page...</p>
  </>
);

CollectionsPage.Layout = DashboardLayout;

export default requireAuth(CollectionsPage);
