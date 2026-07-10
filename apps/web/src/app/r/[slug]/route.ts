import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getShadcnRegistry, getShadcnRegistryItem } from "@/lib/content-data";

type RegistryParams = {
  params: Promise<{ slug: string }>;
};

export const GET = async (_: NextRequest, { params }: RegistryParams) => {
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
