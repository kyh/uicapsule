// =============================================================================
// CONTENT LOADING MODE: Direct import (no DB required)
// =============================================================================
// To switch to database mode:
//   1. Change import below to: import { contentRouter } from "./content/content-router";
//   2. In packages/builder/package.json: change --mode export to --mode db
//   3. In root package.json dev script: change to "turbo watch db studio dev --continue"
// =============================================================================
import { contentRouter } from "./content/content-router-local";
import { organizationRouter } from "./organization/organization-router";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  content: contentRouter,
  organization: organizationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
