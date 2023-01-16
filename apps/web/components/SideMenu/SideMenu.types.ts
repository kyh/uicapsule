import type { MenuItem, NormalizedMenuItem } from "constants/menu";

export type Props = {
  fullWidth?: boolean;
  extraSection?: MenuItem[];
};

type WithQuery = { query?: string };

export type MenuItemProps = (NormalizedMenuItem | MenuItem) & {
  padded?: boolean;
  hovered?: string;
  setHovered?: (url: string) => void;
} & Pick<Props, "fullWidth">;

export type MenuGroupProps = MenuItemProps & WithQuery;
export type MenuSectionProps = MenuItemProps & WithQuery;
