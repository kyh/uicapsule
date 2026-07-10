import { organizationRouter } from "./organization/organization-router";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  organization: organizationRouter,
});

export type AppRouter = typeof appRouter;
