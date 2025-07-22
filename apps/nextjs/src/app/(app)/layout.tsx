import { Footer, Header } from "@/components/layout";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <section className="shadow-border mx-auto max-w-[1440px] shadow-[0_0_0_1px]">
      <Header className="bg-background sticky top-0 z-10 border-b" />
      {children}
      <Footer />
    </section>
  );
};

export default Layout;
