import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { Separator } from "@repo/ui/components/separator";
import { cn } from "cn";

// Only the inner corners and the doubled border are removed; each child keeps
// the outer radius its own variant sets, so pill buttons stay pills. Composite
// roots (e.g. NavigationMenu) wrap each trigger in an item element, so every
// rule also targets the single button one level down.
const buttonGroupVariants = cva(
  "flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10 has-[>[data-slot=button-group]]:gap-2 [&>input]:flex-1",
  {
    variants: {
      orientation: {
        horizontal:
          "[&>[data-slot]:not(:last-child)]:rounded-r-none [&>:not(:last-child)>[data-slot=button]]:rounded-r-none [&>[data-slot]:not(:first-child)]:rounded-l-none [&>[data-slot]:not(:first-child)]:border-l-0 [&>:not(:first-child)>[data-slot=button]]:rounded-l-none [&>:not(:first-child)>[data-slot=button]]:border-l-0",
        vertical:
          "flex-col [&>[data-slot]:not(:last-child)]:rounded-b-none [&>:not(:last-child)>[data-slot=button]]:rounded-b-none [&>[data-slot]:not(:first-child)]:rounded-t-none [&>[data-slot]:not(:first-child)]:border-t-0 [&>:not(:first-child)>[data-slot=button]]:rounded-t-none [&>:not(:first-child)>[data-slot=button]]:border-t-0",
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
