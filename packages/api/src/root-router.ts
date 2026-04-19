// =============================================================================
// CONTENT LOADING MODE: Database (Turso / libSQL)
// =============================================================================
// To switch to direct-import mode (no DB required):
//   1. Change import below to: import { contentRouter } from "./content/content-router-local";
//   2. In packages/builder/package.json: change --mode db to --mode export
//   3. In root package.json dev script: change to "turbo watch dev --continue"
// =============================================================================
import { contentRouter } from "./content/content-router";
import { organizationRouter } from "./organization/organization-router";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  content: contentRouter,
  organization: organizationRouter,
});

export type AppRouter = typeof appRouter;
