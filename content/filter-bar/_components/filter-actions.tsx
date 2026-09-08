import { Button } from "./ui";
import { cn } from "cn";

import type { DataTableFilterActions } from "../filter-package";

interface FilterActionsProps {
  hasFilters: boolean;
  actions?: DataTableFilterActions;
}

export const FilterActions = ({ hasFilters, actions }: FilterActionsProps) => (
  <Button
    className={cn("text-(--muted-foreground) h-7 px-2 font-normal", !hasFilters && "hidden")}
    variant="ghost"
    onClick={() => actions?.removeAllFilters()}
  >
    clear
  </Button>
);
