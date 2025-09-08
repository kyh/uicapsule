import React, { memo } from "react";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/utils";
import { FilterXIcon } from "lucide-react";

import type { DataTableFilterActions } from "../../filter-bar";

interface FilterActionsProps {
  hasFilters: boolean;
  actions?: DataTableFilterActions;
}

export const FilterActions = memo(__FilterActions);
function __FilterActions({ hasFilters, actions }: FilterActionsProps) {
  return (
    <Button
      className={cn("h-7 !px-2", !hasFilters && "hidden")}
      variant="destructive"
      onClick={actions?.removeAllFilters}
    >
      <FilterXIcon />
      <span className="hidden md:block">clear</span>
    </Button>
  );
}
