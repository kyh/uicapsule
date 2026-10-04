import { os, requireSession } from "../orpc";

const authed = os.user.use(requireSession);

export const userRouter = {
  me: authed.me.handler(({ context }) => context.session.user),
};
