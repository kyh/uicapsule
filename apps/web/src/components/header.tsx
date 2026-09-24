import { HeaderNav } from "@/components/header-nav";
import { ProfileSlot } from "@/components/profile-slot";
import { getSearchEntries } from "@/lib/content-data";

export const Header = async ({ className }: { className?: string }) => (
  <HeaderNav
    className={className}
    searchEntries={await getSearchEntries()}
    profile={<ProfileSlot />}
  />
);
