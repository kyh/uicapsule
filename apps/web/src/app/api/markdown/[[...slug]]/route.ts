import { MARKDOWN_CONTENT_TYPE } from "@/lib/agent/accept";
import {
  renderComponentMarkdown,
  renderHomeMarkdown,
  renderNotFoundMarkdown,
  renderProsePageMarkdown,
} from "@/lib/agent/markdown";
import { findPageByPath } from "@/lib/agent/site-pages";
import { getAllContent, getSourceFiles } from "@/lib/content-data";

interface MarkdownParams {
  params: Promise<{ slug?: string[] }>;
}

const buildBody = async (segments: string[]) => {
  if (segments.length === 0) {
    return {
      body: renderHomeMarkdown(await getAllContent()),
      status: 200,
    };
  }

  const pathname = `/${segments.join("/")}`;

  const page = findPageByPath(pathname);

  if (page) {
    return { body: renderProsePageMarkdown(page), status: 200 };
  }

  const [first, slug, ...rest] = segments;

  if (first === "ui" && slug && rest.length === 0) {
    const all = await getAllContent();
    const component = all.find((entry) => entry.slug === slug);

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
    headers: {
      "Cache-Control":
        status === 200
          ? "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400"
          : "no-store",
      "Content-Type": MARKDOWN_CONTENT_TYPE,
      Vary: "Accept",
    },
    status,
  });
};
