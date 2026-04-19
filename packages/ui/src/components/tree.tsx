"use client";

import * as React from "react";
import { useRender } from "@base-ui/react/use-render";
import { ChevronDownIcon } from "lucide-react";

import type { ItemInstance } from "@headless-tree/core";
import { cn } from "@repo/ui/lib/utils";

type TreeContextValue<T = any> = {
  indent: number;
  currentItem?: ItemInstance<T>;
  tree?: any;
};

const TreeContext = React.createContext<TreeContextValue>({
  indent: 20,
  currentItem: undefined,
  tree: undefined,
});

function useTreeContext<T = any>() {
  return React.useContext(TreeContext) as TreeContextValue<T>;
}

type TreeProps = {
  indent?: number;
  tree?: any;
} & React.HTMLAttributes<HTMLDivElement>;

const Tree = ({ indent = 20, tree, className, ...props }: TreeProps) => {
  const containerProps =
    tree && typeof tree.getContainerProps === "function" ? tree.getContainerProps() : {};
  const mergedProps = { ...props, ...containerProps };

  const { style: propStyle, ...otherProps } = mergedProps;

  const mergedStyle = {
    ...propStyle,
    "--tree-indent": `${indent}px`,
  } as React.CSSProperties;

  return (
    <TreeContext.Provider value={{ indent, tree }}>
      <div
        data-slot="tree"
        style={mergedStyle}
        className={cn("flex flex-col", className)}
        {...otherProps}
      />
    </TreeContext.Provider>
  );
};

type TreeItemProps<T = any> = {
  item: ItemInstance<T>;
  indent?: number;
  render?: useRender.RenderProp<React.HTMLAttributes<HTMLElement>>;
} & React.HTMLAttributes<HTMLButtonElement>;

function TreeItem<T = any>({
  item,
  className,
  render,
  children,
  ...props
}: Omit<TreeItemProps<T>, "indent">) {
  const { indent } = useTreeContext<T>();

  const itemProps = typeof item.getProps === "function" ? item.getProps() : {};
  const mergedProps = { ...props, ...itemProps };

  const { style: propStyle, ...otherProps } = mergedProps;

  const mergedStyle = {
    ...propStyle,
    "--tree-padding": `${item.getItemMeta().level * indent}px`,
  } as React.CSSProperties;

  const element = useRender({
    render: render ?? <button type="button" />,
    props: {
      "data-slot": "tree-item",
      style: mergedStyle,
      className: cn(
        "z-10 ps-(--tree-padding) outline-hidden select-none not-last:pb-0.5 focus:z-20 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      ),
      "data-focus": typeof item.isFocused === "function" ? item.isFocused() || false : undefined,
      "data-folder": typeof item.isFolder === "function" ? item.isFolder() || false : undefined,
      "data-selected":
        typeof item.isSelected === "function" ? item.isSelected() || false : undefined,
      "data-drag-target":
        typeof item.isDragTarget === "function" ? item.isDragTarget() || false : undefined,
      "data-search-match":
        typeof item.isMatchingSearch === "function"
          ? item.isMatchingSearch() || false
          : undefined,
      "aria-expanded": item.isExpanded(),
      children,
      ...otherProps,
    },
  });

  return (
    <TreeContext.Provider value={{ indent, currentItem: item }}>{element}</TreeContext.Provider>
  );
}

type TreeItemLabelProps<T = any> = {
  item?: ItemInstance<T>;
} & React.HTMLAttributes<HTMLSpanElement>;

function TreeItemLabel<T = any>({
  item: propItem,
  children,
  className,
  ...props
}: TreeItemLabelProps<T>) {
  const { currentItem } = useTreeContext<T>();
  const item = propItem || currentItem;

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
      {children || (typeof item.getItemName === "function" ? item.getItemName() : null)}
    </span>
  );
}

const TreeDragLine = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const { tree } = useTreeContext();

  if (!tree || typeof tree.getDragLineStyle !== "function") {
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
