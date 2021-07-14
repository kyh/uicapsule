import { useRouter } from "next/router";
import DashboardFullLayout from "components/DashboardFullLayout";
import UIDetailsEditSection from "components/UIDetailsEditSection";
import { requireAuth } from "actions/auth";

const UIPage = () => {
  const router = useRouter();
  return <UIDetailsEditSection id={router.query.id} />;
};

UIPage.Layout = DashboardFullLayout;

export default requireAuth(UIPage);
