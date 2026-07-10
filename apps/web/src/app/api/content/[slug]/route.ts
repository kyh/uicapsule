import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSourceFiles } from "@/lib/content-data";

type SourceParams = {
  params: Promise<{ slug: string }>;
};

// Internal seam for the source drawer and zip download. The shadcn registry
// at /r/[slug].json is a contract owned by external CLI consumers — its file
// shape can change for install compatibility without breaking this route.
export const GET = async (_: NextRequest, { params }: SourceParams) => {
  const { slug } = await params;

  const sourceFiles = await getSourceFiles(slug);
  if (!sourceFiles) {
    return NextResponse.json({ error: `Component not found: ${slug}` }, { status: 404 });
  }

  return NextResponse.json(sourceFiles);
};
