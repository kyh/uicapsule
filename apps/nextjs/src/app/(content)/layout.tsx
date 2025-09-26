import { Header } from "@/components/layout";
import { getSearchEntries } from "@/lib/search";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const searchEntries = await getSearchEntries();

  return (
    <section className="mx-auto max-w-[1440px]">
      <Header searchEntries={searchEntries} />
      {children}
    </section>
  );
};

export default Layout;
