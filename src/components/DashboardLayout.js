import React from "react";
import DashboardNavbar from "components/DashboardNavbar";
import Footer from "components/Footer";

function DashboardLayout({ children }) {
  return (
    <>
      <DashboardNavbar />
      {children}
      <Footer />
    </>
  );
}

export default DashboardLayout;
