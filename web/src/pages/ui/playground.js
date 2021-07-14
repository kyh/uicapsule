import Head from "next/head";
import DashboardLayout from "components/DashboardLayout";
import { requireAuth } from "actions/auth";

const PlaygroundPage = () => (
  <>
    <Head>
      <title>Playground</title>
    </Head>
    <p>Playground Page...</p>
  </>
);

PlaygroundPage.Layout = DashboardLayout;

export default requireAuth(PlaygroundPage);
