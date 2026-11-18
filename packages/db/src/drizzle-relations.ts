import { defineRelations } from "drizzle-orm";

import * as schema from "./drizzle-schema-auth";

export const relations = defineRelations(schema, (r) => ({
  account: {
    user: r.one.user({ from: r.account.userId, to: r.user.id }),
  },
  session: {
    user: r.one.user({ from: r.session.userId, to: r.user.id }),
  },
  user: {
    accounts: r.many.account({ from: r.user.id, to: r.account.userId }),
    sessions: r.many.session({ from: r.user.id, to: r.session.userId }),
  },
}));
