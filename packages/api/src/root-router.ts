import { createTRPCRouter } from "./trpc";
import { userRouter } from "./user/user-router";

export const appRouter = createTRPCRouter({
  user: userRouter,
});

export type AppRouter = typeof appRouter;
