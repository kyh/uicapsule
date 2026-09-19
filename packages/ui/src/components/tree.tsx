"use client";

import { createContext, useContext, useMemo } from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import { useRender } from "@base-ui/react/use-render";
import { ChevronDownIcon } from "lucide-react";

import type { ItemInstance, TreeInstance } from "@headless-tree/core";
import { cn } from "cn";

// Feature methods only exist when the consumer enables their headless-tree feature.
type TreeStyle = CSSProperties & Record<`--${string}`, string>;

interface TreeContextValue {
  indent: number;
  currentItem?: Pick<ItemInstance<unknown>, "isFolder" | "getItemName">;
  tree?: Pick<TreeInstance<unknown>, "getDragLineStyle">;
}

const TreeContext = createContext<TreeContextValue>({
  currentItem: undefined,
  indent: 20,
  tree: undefined,
});

type TreeProps<T = unknown> = {
  indent?: number;
  tree?: TreeInstance<T>;
} & HTMLAttributes<HTMLDivElement>;

const Tree = <T = unknown,>({ indent = 20, tree, className, ...props }: TreeProps<T>) => {
  const context = useMemo(() => ({ indent, tree }), [indent, tree]);
  const containerProps = tree?.getContainerProps?.() ?? {};
  const mergedProps = { ...props, ...containerProps };

  const { style: propStyle, ...otherProps } = mergedProps;

  const mergedStyle: TreeStyle = {
    ...propStyle,
    "--tree-indent": `${indent}px`,
  };

  return (
    <TreeContext.Provider value={context}>
      <div
        data-slot="tree"
        style={mergedStyle}
        className={cn("flex flex-col", className)}
        {...otherProps}
      />
    </TreeContext.Provider>
  );
};

type TreeItemProps<T = unknown> = {
  item: ItemInstance<T>;
  render?: useRender.RenderProp<HTMLAttributes<HTMLElement>>;
} & HTMLAttributes<HTMLButtonElement>;

const TreeItem = <T = unknown,>({
  item,
  className,
  render,
  children,
  ...props
}: TreeItemProps<T>) => {
  const { indent } = useContext(TreeContext);
  const context = useMemo(() => ({ currentItem: item, indent }), [indent, item]);

  const itemProps = item.getProps?.() ?? {};
  const mergedProps = { ...props, ...itemProps };

  const { style: propStyle, ...otherProps } = mergedProps;

  const mergedStyle: TreeStyle = {
    ...propStyle,
    "--tree-padding": `${item.getItemMeta().level * indent}px`,
  };

  const element = useRender({
    props: {
      "aria-expanded": item.isExpanded(),
      children,
      className: cn(
        "z-10 ps-(--tree-padding) outline-hidden select-none not-last:pb-0.5 focus:z-20 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      ),
      "data-drag-target": item.isDragTarget?.(),
      "data-focus": item.isFocused?.(),
      "data-folder": item.isFolder?.(),
      "data-search-match": item.isMatchingSearch?.(),
      "data-selected": item.isSelected?.(),
      "data-slot": "tree-item",
      style: mergedStyle,
      ...otherProps,
    },
    // oxlint-disable-next-line jsx-a11y/control-has-associated-label -- useRender merges `children` into whichever element renders
    render: render ?? <button type="button" />,
  });

  return <TreeContext.Provider value={context}>{element}</TreeContext.Provider>;
};

type TreeItemLabelProps<T = unknown> = {
  item?: ItemInstance<T>;
} & HTMLAttributes<HTMLSpanElement>;

const TreeItemLabel = <T = unknown,>({
  item: propItem,
  children,
  className,
  ...props
}: TreeItemLabelProps<T>) => {
  const { currentItem } = useContext(TreeContext);
  const item = propItem ?? currentItem;

  if (!item) {
    console.warn("TreeItemLabel: No item provided via props or context");
    return null;
  }

  return (
    <span
      data-slot="tree-item-label"
      className={cn(
        "hover:bg-accent in-focus-visible:ring-ring/50 in-data-[drag-target=true]:bg-accent in-data-[selected=true]:bg-accent in-data-[selected=true]:text-accent-foreground flex items-center gap-1 rounded-sm px-2 py-1.5 text-sm transition-colors not-in-data-[folder=true]:ps-7 in-focus-visible:ring-[3px] in-data-[search-match=true]:bg-blue-400/20! [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {item.isFolder() && (
        <ChevronDownIcon className="text-muted-foreground size-4 in-aria-[expanded=false]:-rotate-90" />
      )}
      {children ?? item.getItemName?.() ?? null}
    </span>
  );
};

const TreeDragLine = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  const { tree } = useContext(TreeContext);

  if (!tree?.getDragLineStyle) {
    console.warn(
      "TreeDragLine: No tree provided via context or tree does not have getDragLineStyle method",
    );
    return null;
  }

  const dragLine = tree.getDragLineStyle();
  return (
    <div
      style={dragLine}
      className={cn(
        "bg-primary before:border-primary before:bg-background absolute z-30 -mt-px h-0.5 w-[unset] before:absolute before:-top-[3px] before:left-0 before:size-2 before:rounded-full before:border-2",
        className,
      )}
      {...props}
    />
  );
};

export { Tree, TreeItem, TreeItemLabel, TreeDragLine };
