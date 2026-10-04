import { type } from "@orpc/contract";

import { protectedBase } from "../base";

/** better-auth's session user as `auth.api.getSession` returns it with this app's options (no
 * plugins, no additional fields). */
interface SessionUser {
  createdAt: Date;
  email: string;
  emailVerified: boolean;
  id: string;
  image?: string | null | undefined;
  name: string;
  updatedAt: Date;
}

export const userContract = {
  me: protectedBase.output(type<SessionUser>()),
};
