import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { caller } from "@/trpc/server";

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

  const slugWithoutExtension = slug.replace(".json", "");

  try {
    // Handle registry index
    if (slugWithoutExtension === "registry") {
      const registry = await caller.content.shadcnRegistry();
      return NextResponse.json(registry);
    }

    // Handle individual component
    const pkg = await caller.content.shadcnRegistryItem({
      slug: slugWithoutExtension,
    });
    return NextResponse.json(pkg);
  } catch (error) {
    const errorMessage =
      slugWithoutExtension === "registry"
        ? "Failed to get registry"
        : "Failed to get package";

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
};
