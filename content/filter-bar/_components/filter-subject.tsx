import { isValidElement } from "react";
import type { Column, ColumnDataType } from "../filter-package";

interface FilterSubjectProps<TType extends ColumnDataType> {
  column: Column<TType>;
  entityName?: string;
}

export const FilterSubject = <TType extends ColumnDataType>({
  column,
  entityName,
}: FilterSubjectProps<TType>) => {
  const subject = column.type === "boolean" ? entityName : column.displayName;

  const { icon: Icon } = column;

  return (
    <span className="flex items-center gap-1 px-2 font-medium whitespace-nowrap select-none">
      {Icon &&
        (isValidElement(Icon)
          ? Icon
          : (() => {
              const IconComp = Icon;
              return <IconComp className="text-(--primary) size-4 stroke-[2.25px]" />;
            })())}

      <span>{subject}</span>
    </span>
  );
};
