import { MARKDOWN_CONTENT_TYPE } from "@/lib/agent/accept";
import {
  renderComponentMarkdown,
  renderHomeMarkdown,
  renderNotFoundMarkdown,
  renderProsePageMarkdown,
} from "@/lib/agent/markdown";
import { findPageByPath } from "@/lib/agent/site-pages";
import { getAllContent, getContentList, getSourceFiles } from "@/lib/content-data";

type MarkdownParams = {
  params: Promise<{ slug?: string[] }>;
};

/**
 * The Markdown half of every page's content negotiation. `src/proxy.ts`
 * rewrites here when a client prefers `text/markdown`, or when it asks for the
 * `.md` sibling of a URL directly; nothing links to `/api/markdown/*` and it is
 * not a public contract.
 *
 * A path with no Markdown representation answers 404 with a Markdown body that
 * points at the recovery surfaces, so an agent that guessed a URL wrong learns
 * where to look instead of getting an empty error.
 */
const buildBody = async (segments: string[]): Promise<{ body: string; status: number }> => {
  if (segments.length === 0) {
    // Mirrors the HTML home page, which shows the listed grid — not the full
    // catalog. /llms.txt is the surface that carries every component.
    return { body: renderHomeMarkdown(await getContentList([])), status: 200 };
  }

  const pathname = `/${segments.join("/")}`;

  const page = findPageByPath(pathname);
  if (page) return { body: renderProsePageMarkdown(page), status: 200 };

  const [first, slug, ...rest] = segments;
  if (first === "ui" && slug && rest.length === 0) {
    const component = (await getAllContent()).find((entry) => entry.slug === slug);
    if (component) {
      const sourceFiles = await getSourceFiles(slug);
      return {
        body: renderComponentMarkdown(
          component,
          (sourceFiles ?? []).map((file) => file.path),
        ),
        status: 200,
      };
    }
  }

  return { body: renderNotFoundMarkdown(pathname), status: 404 };
};

export const GET = async (_request: Request, { params }: MarkdownParams) => {
  const { slug = [] } = await params;
  const { body, status } = await buildBody(slug);

  return new Response(body, {
    status,
    headers: {
      "Content-Type": MARKDOWN_CONTENT_TYPE,
      Vary: "Accept",
      "Cache-Control":
        status === 200
          ? "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400"
          : "no-store",
    },
  });
};
