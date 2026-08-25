import { userRouter } from "./user/user-router";

export const appRouter = {
  user: userRouter,
};

export type AppRouter = typeof appRouter;
