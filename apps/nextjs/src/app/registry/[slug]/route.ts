import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getContentComponentPackage } from "@/lib/content";

type RegistryParams = {
  params: Promise<{ slug: string }>;
};

export const GET = async (_: NextRequest, { params }: RegistryParams) => {
  const { slug } = await params;

  if (!slug.endsWith(".json")) {
    return NextResponse.json(
      { error: "Component must end with .json" },
      { status: 400 },
    );
  }

  try {
    const pkg = await getContentComponentPackage(slug.replace(".json", ""));

    return NextResponse.json(pkg);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get package", details: error },
      { status: 500 },
    );
  }
};
