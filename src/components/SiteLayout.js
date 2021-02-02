import React from "react";
import SiteNavbar from "components/SiteNavbar";
import Footer from "components/Footer";

function SiteLayout({ children }) {
  return (
    <>
      <SiteNavbar />
      {children}
      <Footer />
    </>
  );
}

export default SiteLayout;
