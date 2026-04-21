
import { forwardRef, type ComponentPropsWithoutRef } from "react";
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

const Feed = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-0", className)} {...props} />
  ),
);
Feed.displayName = "Feed";

const FeedItem = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("group relative flex gap-x-5", className)} {...props} />
  ),
);
FeedItem.displayName = "FeedItem";

const FeedIndicator = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative group-last:after:hidden after:absolute after:top-8 after:bottom-2 after:start-3 after:-translate-x-[0.5px] after:border-s after:border-line-2",
        className,
      )}
      {...props}
    >
      <div className="relative z-10 flex size-6 items-center justify-center">{children}</div>
    </div>
  ),
);
FeedIndicator.displayName = "FeedIndicator";

const FeedContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("grow pb-8 group-last:pb-0", className)} {...props} />
  ),
);
FeedContent.displayName = "FeedContent";

const FeedLabel = forwardRef<HTMLParagraphElement, ComponentPropsWithoutRef<"p">>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("mb-1 text-xs text-muted-foreground-2", className)} {...props} />
  ),
);
FeedLabel.displayName = "FeedLabel";

const FeedTitle = forwardRef<HTMLParagraphElement, ComponentPropsWithoutRef<"p">>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm font-semibold text-foreground", className)} {...props} />
  ),
);
FeedTitle.displayName = "FeedTitle";

const FeedDescription = forwardRef<HTMLParagraphElement, ComponentPropsWithoutRef<"p">>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("mt-1 text-sm text-muted-foreground-2", className)} {...props} />
  ),
);
FeedDescription.displayName = "FeedDescription";

const FeedList = forwardRef<HTMLUListElement, ComponentPropsWithoutRef<"ul">>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("ms-6 mt-3 list-disc space-y-1.5", className)} {...props} />
  ),
);
FeedList.displayName = "FeedList";

const FeedListItem = forwardRef<HTMLLIElement, ComponentPropsWithoutRef<"li">>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn("ps-1 text-sm text-muted-foreground-2", className)} {...props} />
  ),
);
FeedListItem.displayName = "FeedListItem";

export {
  Feed,
  FeedItem,
  FeedIndicator,
  FeedContent,
  FeedLabel,
  FeedTitle,
  FeedDescription,
  FeedList,
  FeedListItem,
};
