import React from "react";
import Image from "next/image";
import Link from "next/link";
import { MDXContent as RootMDXContent } from "@content-collections/mdx/react";
import { cn } from "@kyh/ui/utils";

type MDXContentProps = React.ComponentProps<typeof RootMDXContent>;

const customComponents: MDXContentProps["components"] = {
  // Preview: ({ children, codeblock }) => (
  //   <Preview codeblock={codeblock ? codeblock : undefined}>{children}</Preview>
  // ),
  Image: ({ ...props }) => (
    <Image
      unoptimized
      width={1000}
      height={1000}
      sizes="100vw"
      style={{
        objectFit: "contain",
        width: "100%",
        height: "auto",
        objectPosition: "center",
        transition: "all 0.5s ease",
      }}
      {...props}
    />
  ),
  h1: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    return <h1 className={cn("text-3xl font-medium", className)} {...props} />;
  },
  h2: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
    return <h2 className={cn("text-2xl font-medium", className)} {...props} />;
  },
  a: ({ children, href }) => {
    return (
      <Link
        href={href ?? ""}
        className="text-muted inline-flex items-center gap-1"
      >
        {children}
      </Link>
    );
  },
  blockquote: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <blockquote
      className={cn("border-gray-4 text-muted mt-6 border-l-2 pl-6", className)}
      {...props}
    />
  ),
  table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <table className={cn("w-full overflow-hidden", className)} {...props} />
  ),
  th: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th
      className={cn(
        "border-border border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td
      className={cn(
        "border-border border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className={cn("mt-2 ml-2 list-decimal", className)} {...props} />
  ),
  ul: ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className={cn("mt-2 ml-2 list-disc", className)} {...props} />
  ),
  li: ({ className, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className={cn("mt-2 ml-2 list-item", className)} {...props} />
  ),
};

export const MDXContent = ({ code }: MDXContentProps) => {
  return <RootMDXContent code={code} components={customComponents} />;
};
