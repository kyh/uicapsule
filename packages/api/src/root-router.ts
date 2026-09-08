import { requestRouter } from "./request/request-router";
import { userRouter } from "./user/user-router";

export const appRouter = {
  request: requestRouter,
  user: userRouter,
};

export type AppRouter = typeof appRouter;
