import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Nav />
      {children}
      <Footer />
    </>
  );
};

export default Layout;
