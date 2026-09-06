import assert from "node:assert/strict";
import { test } from "node:test";

import * as drizzleSchema from "@repo/db/drizzle-schema-auth";
import { getAuthTables } from "better-auth/db";
import { getTableColumns, is, Table } from "drizzle-orm";

import { auth } from "./auth";

// Compare library requirements with the handwritten schema; no database connection needed.
for (const [model, authTable] of Object.entries(getAuthTables(auth.options))) {
  test(`${model} matches better-auth's fields and nullability`, () => {
    const table = Object.entries(drizzleSchema).find(([key]) => key === authTable.modelName)?.[1];
    assert.ok(is(table, Table), `Missing table export: ${authTable.modelName}`);

    const columns = new Map(Object.entries(getTableColumns(table)));
    const fields = Object.entries(authTable.fields).map(([key, field]) => ({
      name: field.fieldName ?? key,
      required: field.required === true,
    }));

    assert.deepEqual(
      [...columns.keys()].toSorted(),
      ["id", ...fields.map((field) => field.name)].toSorted(),
    );

    for (const field of fields) {
      const column = columns.get(field.name);
      assert.ok(column, `Missing column: ${field.name}`);
      assert.equal(column.notNull, field.required, `${model}.${field.name} nullability`);
    }
  });
}
