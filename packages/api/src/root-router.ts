import { contentRouter } from "./content/content-router-local";
import { organizationRouter } from "./organization/organization-router";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  content: contentRouter,
  organization: organizationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
