import type { ComponentProps } from "react";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

const Feed = ({ className, ...props }: ComponentProps<"div">) => (
  <div className={cn("space-y-0", className)} {...props} />
);

const FeedItem = ({ className, ...props }: ComponentProps<"div">) => (
  <div className={cn("group relative flex gap-x-5", className)} {...props} />
);

const FeedIndicator = ({ className, children, ...props }: ComponentProps<"div">) => (
  <div
    className={cn(
      "relative group-last:after:hidden after:absolute after:top-8 after:bottom-2 after:start-3 after:-translate-x-[0.5px] after:border-s after:border-line-2",
      className,
    )}
    {...props}
  >
    <div className="relative z-10 flex size-6 items-center justify-center">{children}</div>
  </div>
);

const FeedContent = ({ className, ...props }: ComponentProps<"div">) => (
  <div className={cn("grow pb-8 group-last:pb-0", className)} {...props} />
);

const FeedLabel = ({ className, ...props }: ComponentProps<"p">) => (
  <p className={cn("mb-1 text-xs text-muted-foreground-2", className)} {...props} />
);

const FeedTitle = ({ className, ...props }: ComponentProps<"p">) => (
  <p className={cn("text-sm font-semibold text-foreground", className)} {...props} />
);

const FeedDescription = ({ className, ...props }: ComponentProps<"p">) => (
  <p className={cn("mt-1 text-sm text-muted-foreground-2", className)} {...props} />
);

const FeedList = ({ className, ...props }: ComponentProps<"ul">) => (
  <ul className={cn("ms-6 mt-3 list-disc space-y-1.5", className)} {...props} />
);

const FeedListItem = ({ className, ...props }: ComponentProps<"li">) => (
  <li className={cn("ps-1 text-sm text-muted-foreground-2", className)} {...props} />
);

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
