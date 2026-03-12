import React from "react";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

const Feed = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-0", className)} {...props} />
  ),
);
Feed.displayName = "Feed";

const FeedItem = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("group relative flex gap-x-5", className)} {...props} />
  ),
);
FeedItem.displayName = "FeedItem";

const FeedIndicator = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
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

const FeedContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("grow pb-8 group-last:pb-0", className)} {...props} />
  ),
);
FeedContent.displayName = "FeedContent";

const FeedLabel = React.forwardRef<HTMLParagraphElement, React.ComponentPropsWithoutRef<"p">>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("mb-1 text-xs text-muted-foreground-2", className)} {...props} />
  ),
);
FeedLabel.displayName = "FeedLabel";

const FeedTitle = React.forwardRef<HTMLParagraphElement, React.ComponentPropsWithoutRef<"p">>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm font-semibold text-foreground", className)} {...props} />
  ),
);
FeedTitle.displayName = "FeedTitle";

const FeedDescription = React.forwardRef<HTMLParagraphElement, React.ComponentPropsWithoutRef<"p">>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("mt-1 text-sm text-muted-foreground-2", className)} {...props} />
  ),
);
FeedDescription.displayName = "FeedDescription";

const FeedList = React.forwardRef<HTMLUListElement, React.ComponentPropsWithoutRef<"ul">>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("ms-6 mt-3 list-disc space-y-1.5", className)} {...props} />
  ),
);
FeedList.displayName = "FeedList";

const FeedListItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<"li">>(
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
