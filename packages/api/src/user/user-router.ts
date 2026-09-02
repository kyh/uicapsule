import { protectedProcedure } from "../orpc";

export const userRouter = {
  me: protectedProcedure.handler(({ context }) => context.session.user),
};
