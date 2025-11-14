import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isLocalContentComponent } from "@repo/api/content/content-schema";

import { caller } from "@/trpc/server";

export const GET = async (_: NextRequest) => {
  try {
    const components = await caller.content.list({});

    // Filter to only local components (remote components don't support shadcn registry)
    const localComponents = components.filter(isLocalContentComponent);

    const registry = {
      $schema: "https://ui.shadcn.com/schema/registry.json",
      name: "uicapsule",
      homepage: "https://uicapsule.com",
      items: localComponents.map((component) => ({
        name: component.slug,
        type: "registry:component" as const,
        title: component.name,
        description: component.description ?? "",
        files: [
          {
            path: `registry/${component.slug}.json`,
            type: "registry:component" as const,
          },
        ],
      })),
    };

    return NextResponse.json(registry);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get registry", details: error },
      { status: 500 },
    );
  }
};
