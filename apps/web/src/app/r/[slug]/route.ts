import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getLocalSlugs, getShadcnRegistry, getShadcnRegistryItem } from "@/lib/content-data";

export const generateStaticParams = async () => {
  const slugs = await getLocalSlugs();
  return ["registry", ...slugs].map((slug) => ({ slug: `${slug}.json` }));
};

export const GET = async (_: NextRequest, { params }: RouteContext<"/r/[slug]">) => {
  const { slug } = await params;

  if (!slug.endsWith(".json")) {
    return NextResponse.json({ error: "Component must end with .json" }, { status: 400 });
  }

  const slugWithoutExtension = slug.replace(".json", "");

  if (slugWithoutExtension === "registry") {
    return NextResponse.json(await getShadcnRegistry());
  }

  const item = await getShadcnRegistryItem(slugWithoutExtension);
  if (!item) {
    return NextResponse.json(
      { error: `Component not found: ${slugWithoutExtension}` },
      { status: 404 },
    );
  }

  return NextResponse.json(item);
};
