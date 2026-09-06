import { HeaderNav } from "@/components/header-nav";
import { getSearchEntries } from "@/lib/content-data";

export const Header = async ({ className }: { className?: string }) => (
  <HeaderNav className={className} searchEntries={await getSearchEntries()} />
);
