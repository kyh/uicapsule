import { serializeJsonLd } from "@/lib/agent/structured-data";

import type { JsonLdNode } from "@/lib/agent/structured-data";

/**
 * Emits a schema.org graph as `application/ld+json`. The serializer escapes
 * `<`, so nothing in the graph can close the script tag early.
 */
export const JsonLd = ({ node }: { node: JsonLdNode }) => (
  <script type="application/ld+json">{serializeJsonLd(node)}</script>
);
