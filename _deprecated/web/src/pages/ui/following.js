import SEO from "components/SEO";
import DashboardLayout from "components/DashboardLayout";
import { requireAuth } from "actions/auth";

const FollowingPage = () => {
  return (
    <>
      <SEO title="Following" />
      <p>Following Page...</p>
    </>
  );
};

FollowingPage.Layout = DashboardLayout;

export default requireAuth(FollowingPage);
