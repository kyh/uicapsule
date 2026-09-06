import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSourceFiles } from "@/lib/content-data";

type SourceParams = {
  params: Promise<{ slug: string }>;
};

// Keep the drawer/zip payload independent of shadcn's external registry format.
export const GET = async (_: NextRequest, { params }: SourceParams) => {
  const { slug } = await params;

  const sourceFiles = await getSourceFiles(slug);
  if (!sourceFiles) {
    return NextResponse.json({ error: `Component not found: ${slug}` }, { status: 404 });
  }

  return NextResponse.json(sourceFiles);
};
