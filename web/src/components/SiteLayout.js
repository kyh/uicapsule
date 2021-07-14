import SiteNavbar from "components/SiteNavbar";
import Footer from "components/Footer";

const SiteLayout = ({ children }) => (
  <>
    <SiteNavbar />
    {children}
    <Footer />
  </>
);

export default SiteLayout;
