import React from "react";
import { useRouter } from "next/router";
import DashboardLayout from "components/DashboardLayout";
import SettingsSection from "components/SettingsSection";
import { requireAuth } from "util/auth.js";

const SettingsPage = () => {
  const router = useRouter();
  return (
    <SettingsSection
      section={router.query.section}
      key={router.query.section}
    />
  );
};

SettingsPage.Layout = DashboardLayout;

// Tell Next.js to export static files for each settings page
// See https://nextjs.org/docs/basic-features/data-fetching#getstaticpaths-static-generation
export const getStaticPaths = () => ({
  paths: [
    { params: { section: "general" } },
    { params: { section: "password" } },
    { params: { section: "billing" } },
  ],
  fallback: true,
});

export const getStaticProps = ({ params }) => ({
  props: {}
});

export default requireAuth(SettingsPage);
