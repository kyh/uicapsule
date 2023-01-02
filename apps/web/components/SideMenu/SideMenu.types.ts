import type { MenuItem, NormalizedMenuItem } from "constants/menu";

export type Props = {
  fullWidth?: boolean;
  extraSection?: MenuItem[];
};

type WithQuery = { query?: string };

export type MenuItemProps = (NormalizedMenuItem | MenuItem) & {
  padded?: boolean;
} & Pick<Props, "fullWidth">;

export type MenuGroupProps = (NormalizedMenuItem | MenuItem) &
  WithQuery &
  Pick<Props, "fullWidth">;
export type MenuSectionProps = (NormalizedMenuItem | MenuItem) &
  WithQuery &
  Pick<Props, "fullWidth">;
