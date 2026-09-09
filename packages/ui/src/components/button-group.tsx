import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { Separator } from "@repo/ui/components/separator";
import { cn } from "cn";

// Only the inner corners and the doubled border are removed; each child keeps
// the outer radius its own variant sets, so pill buttons stay pills.
//
// Rules are matched structurally rather than by data-slot: a composite root
// (e.g. NavigationMenu) both wraps each control in an item element and
// overwrites the control's own data-slot with its own.
const buttonGroupVariants = cva(
  "flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10 has-[>[data-slot=button-group]]:gap-2 [&>input]:flex-1",
  {
    variants: {
      orientation: {
        horizontal:
          "[&>*:not(:last-child)]:rounded-r-none [&>*:not(:last-child)>button]:rounded-r-none [&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:first-child)>button]:rounded-l-none [&>*:not(:first-child)>button]:border-l-0",
        vertical:
          "flex-col [&>*:not(:last-child)]:rounded-b-none [&>*:not(:last-child)>button]:rounded-b-none [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:first-child)>button]:rounded-t-none [&>*:not(:first-child)>button]:border-t-0",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  },
);

function ButtonGroup({
  className,
  orientation = "horizontal",
  render,
  ...props
}: useRender.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        role: "group",
        className: cn(buttonGroupVariants({ orientation }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "button-group",
      orientation,
    },
  });
}

function ButtonGroupText({ className, render, ...props }: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(
          "flex items-center gap-2 rounded-md border bg-muted px-2.5 text-sm font-medium shadow-xs [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "button-group-text",
    },
  });
}

function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        "relative self-stretch bg-input data-[orientation=horizontal]:mx-px data-[orientation=horizontal]:w-auto data-[orientation=vertical]:my-px data-[orientation=vertical]:h-auto",
        className,
      )}
      {...props}
    />
  );
}

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText, buttonGroupVariants };
