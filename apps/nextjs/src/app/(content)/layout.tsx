import { Nav } from "@/components/layout";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <section className="mx-auto max-w-[1440px]">
      <Nav />
      {children}
    </section>
  );
};

export default Layout;
