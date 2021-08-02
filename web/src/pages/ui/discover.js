import SEO from "components/SEO";
import DashboardLayout from "components/DashboardLayout";
import DashboardSection from "components/DashboardSection";
import { requireAuth } from "actions/auth";

const DiscoverPage = () => {
  return (
    <>
      <SEO title="Discover" />
      <DashboardSection discover />
    </>
  );
};

DiscoverPage.Layout = DashboardLayout;

export default requireAuth(DiscoverPage);
