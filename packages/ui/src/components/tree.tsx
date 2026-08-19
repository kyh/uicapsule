"use client";

import { createContext, useContext, type CSSProperties, type HTMLAttributes } from "react";
import { useRender } from "@base-ui/react/use-render";
import { ChevronDownIcon } from "lucide-react";

import type { ItemInstance, TreeInstance } from "@headless-tree/core";
import { cn } from "@repo/ui/lib/utils";

// headless-tree's types merge every feature's methods, but a runtime instance
// only carries the methods of the features the consumer enabled — so feature
// methods are optional-called instead of assumed present.

// React's CSSProperties has no index signature for custom properties, so widen
// it rather than reaching for a type assertion.
type TreeStyle = CSSProperties & Record<`--${string}`, string>;

type TreeContextValue<T = any> = {
  indent: number;
  currentItem?: ItemInstance<T>;
  tree?: TreeInstance<T>;
};

const TreeContext = createContext<TreeContextValue>({
  indent: 20,
  currentItem: undefined,
  tree: undefined,
});

function useTreeContext<T = any>(): TreeContextValue<T> {
  return useContext(TreeContext);
}

type TreeProps<T = any> = {
  indent?: number;
  tree?: TreeInstance<T>;
} & HTMLAttributes<HTMLDivElement>;

function Tree<T = any>({ indent = 20, tree, className, ...props }: TreeProps<T>) {
  const containerProps = tree?.getContainerProps?.() ?? {};
  const mergedProps = { ...props, ...containerProps };

  const { style: propStyle, ...otherProps } = mergedProps;

  const mergedStyle: TreeStyle = {
    ...propStyle,
    "--tree-indent": `${indent}px`,
  };

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
}

type TreeItemProps<T = any> = {
  item: ItemInstance<T>;
  indent?: number;
  render?: useRender.RenderProp<HTMLAttributes<HTMLElement>>;
} & HTMLAttributes<HTMLButtonElement>;

function TreeItem<T = any>({
  item,
  className,
  render,
  children,
  ...props
}: Omit<TreeItemProps<T>, "indent">) {
  const { indent } = useTreeContext<T>();

  const itemProps = item.getProps?.() ?? {};
  const mergedProps = { ...props, ...itemProps };

  const { style: propStyle, ...otherProps } = mergedProps;

  const mergedStyle: TreeStyle = {
    ...propStyle,
    "--tree-padding": `${item.getItemMeta().level * indent}px`,
  };

  const element = useRender({
    render: render ?? <button type="button" />,
    props: {
      "data-slot": "tree-item",
      style: mergedStyle,
      className: cn(
        "z-10 ps-(--tree-padding) outline-hidden select-none not-last:pb-0.5 focus:z-20 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      ),
      "data-focus": item.isFocused?.(),
      "data-folder": item.isFolder?.(),
      "data-selected": item.isSelected?.(),
      "data-drag-target": item.isDragTarget?.(),
      "data-search-match": item.isMatchingSearch?.(),
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
} & HTMLAttributes<HTMLSpanElement>;

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
      {children || item.getItemName?.() || null}
    </span>
  );
}

const TreeDragLine = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  const { tree } = useTreeContext();

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
