import React from "react";
import { useRouter } from "next/router";
import DashboardFullLayout from "components/DashboardFullLayout";
import UIDetailsSection from "components/UIDetailsSection";
import { requireAuth } from "util/auth.js";

const UIPage = () => {
  const router = useRouter();
  return <UIDetailsSection id={router.query.id} />;
};

UIPage.Layout = DashboardFullLayout;

export default requireAuth(UIPage);
