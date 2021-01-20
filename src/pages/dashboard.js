import React from "react";
import DashboardSection from "components/DashboardSection";
import { requireAuth } from "util/auth.js";

function DashboardPage(props) {
  return <DashboardSection bgColor="default" size="medium" title="Dashboard" />;
}

export default requireAuth(DashboardPage);
