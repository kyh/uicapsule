import { os } from "./orpc";
import { requestRouter } from "./request/request-router";
import { userRouter } from "./user/user-router";

/** `os.router` fails to compile if any contract procedure is missing or mistyped. */
export const appRouter = os.router({
  request: requestRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
