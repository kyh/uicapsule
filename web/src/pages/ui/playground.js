import SEO from "components/SEO";
import DashboardLayout from "components/DashboardLayout";
import { requireAuth } from "actions/auth";

const PlaygroundPage = () => (
  <>
    <SEO title="Playground" />
    <p>Playground Page...</p>
  </>
);

PlaygroundPage.Layout = DashboardLayout;

export default requireAuth(PlaygroundPage);
