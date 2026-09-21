import { defineRelations } from "drizzle-orm";

import * as schema from "./drizzle-schema-auth";

// One relation graph for the whole schema. Keys are the schema's export names.
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
