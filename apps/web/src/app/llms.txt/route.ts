import { renderLlmsTxt } from "@/lib/agent/llms-txt";
import { getAllContent } from "@/lib/content-data";

/**
 * `/llms.txt` — the llmstxt.org index. Serves the complete catalog, including
 * components the grid keeps unlisted, because this file exists precisely to be
 * the machine-readable superset of what the UI curates.
 */
export const GET = async () => {
  const components = await getAllContent();

  return new Response(renderLlmsTxt(components), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
};
