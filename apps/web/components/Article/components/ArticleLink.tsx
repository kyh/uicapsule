import NextLink from "next/link";
import { Link } from "@uicapsule/components";

const ArticleLink = (props: { children: React.ReactNode; href: string }) => {
  const { href, children } = props;

  if (!href) return null;
  if (!href.startsWith("/") && !href.startsWith("#")) {
    return (
      <Link href={href} attributes={{ target: "_blank" }}>
        {children}
      </Link>
    );
  }

  return (
    <NextLink href={href}>
      <Link href={href}>{children}</Link>
    </NextLink>
  );
};

export default ArticleLink;
