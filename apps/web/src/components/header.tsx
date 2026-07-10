import { HeaderNav } from "@/components/layout";
import { getSearchEntries } from "@/lib/content-data";

/** Server header that owns its search-index data, so layouts can render it without threading props. */
export const Header = async ({ className }: { className?: string }) => (
  <HeaderNav className={className} searchEntries={await getSearchEntries()} />
);
