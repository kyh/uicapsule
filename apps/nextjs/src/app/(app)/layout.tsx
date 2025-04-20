import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <section className="shadow-border mx-auto max-w-[1440px] shadow-[0_0_0_1px]">
      <Nav />
      {children}
      <Footer />
    </section>
  );
};

export default Layout;
