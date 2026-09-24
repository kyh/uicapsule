import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@repo/ui/components/button";

import { notFoundRecoveryLinks } from "@/lib/agent/markdown";
import { rendersOutsideRouter } from "@/lib/agent/site-pages";

const linkClassName = "text-foreground hover:text-primary underline underline-offset-4 transition";

/** `/llms.txt` and `/sitemap.xml` are route handlers the client router cannot navigate to. */
const RecoveryLink = ({ href, children }: { href: string; children: ReactNode }) =>
  rendersOutsideRouter(href) ? (
    <a className={linkClassName} href={href}>
      {children}
    </a>
  ) : (
    <Link className={linkClassName} href={href}>
      {children}
    </Link>
  );

/**
 * The recovery list is the same `notFoundRecoveryLinks` the Markdown 404
 * renders (see lib/agent/markdown.ts): a dead URL should hand a person and an
 * agent the same set of places to look next.
 */
export const NotFoundMessage = () => (
  <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-6 p-8 text-center">
    <div className="space-y-2">
      <p className="text-muted-foreground text-sm font-medium">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved. Component pages live at{" "}
        <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">/ui/&lt;slug&gt;</code>.
      </p>
    </div>
    <nav aria-label="Where to look next" className="w-full border-t pt-6">
      <h2 className="text-muted-foreground mb-3 text-sm font-medium">Try one of these</h2>
      <ul className="text-muted-foreground flex flex-col gap-2 text-left text-sm">
        {notFoundRecoveryLinks.map((item) => (
          <li key={item.label}>
            <RecoveryLink href={item.href ?? "/"}>{item.label}</RecoveryLink>
            {item.text ? ` — ${item.text}` : null}
          </li>
        ))}
      </ul>
    </nav>
    <Button nativeButton={false} render={<Link href="/" />}>
      Back home
    </Button>
  </main>
);
