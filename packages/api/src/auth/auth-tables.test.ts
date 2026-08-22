import * as drizzleSchema from "@repo/db/drizzle-schema-auth";
import { getAuthTables } from "better-auth/db";
import { getTableColumns, is, Table } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { auth } from "./auth";

/**
 * better-auth owns the shape of its tables; the Drizzle schema is a hand-written
 * mirror of them. Nothing else in the gate can catch a divergence — typecheck,
 * lint and build never touch a database, so a field the library requires and the
 * schema lacks stays green until the first real query fails in production. That
 * is exactly how better-auth 1.7's required `account.issuer` slipped through.
 *
 * The drizzle adapter resolves `schema[modelName]` and then `table[fieldName]`,
 * so both sides are matched on the *export key* and the *property name* — not on
 * the physical table/column names, which may differ (`accountId` -> "account_id").
 */

const authTables = getAuthTables(auth.options);

const drizzleTables = new Map<string, Table>(
  Object.entries(drizzleSchema).flatMap(([key, value]) =>
    is(value, Table) ? [[key, value] as const] : [],
  ),
);

const fieldNamesOf = (authTable: (typeof authTables)[string]) =>
  Object.entries(authTable.fields).map(([key, field]) => field.fieldName ?? key);

describe.each(Object.keys(authTables))("%s", (key) => {
  const authTable = authTables[key];

  it("is exported from the Drizzle schema", () => {
    expect({
      model: authTable?.modelName,
      found: drizzleTables.has(authTable?.modelName ?? ""),
    }).toEqual({ model: authTable?.modelName, found: true });
  });

  it("declares every field better-auth requires", () => {
    const table = drizzleTables.get(authTable?.modelName ?? "");
    if (!authTable || !table) return;
    const properties = new Set(Object.keys(getTableColumns(table)));
    const missing = fieldNamesOf(authTable).filter((fieldName) => !properties.has(fieldName));
    expect(missing).toEqual([]);
  });

  it("does not declare fields better-auth does not know about", () => {
    const table = drizzleTables.get(authTable?.modelName ?? "");
    if (!authTable || !table) return;
    const known = new Set([...fieldNamesOf(authTable), "id"]);
    const extra = Object.keys(getTableColumns(table)).filter((property) => !known.has(property));
    expect(extra).toEqual([]);
  });

  it("matches better-auth on which fields are NOT NULL", () => {
    const table = drizzleTables.get(authTable?.modelName ?? "");
    if (!authTable || !table) return;
    const columns = getTableColumns(table);
    const mismatched = Object.entries(authTable.fields)
      .map(([key, field]) => ({
        fieldName: field.fieldName ?? key,
        required: field.required === true,
      }))
      .filter(({ fieldName, required }) => {
        const column = columns[fieldName];
        return column !== undefined && column.notNull !== required;
      })
      .map(({ fieldName, required }) => `${fieldName}: expected notNull=${required}`);
    expect(mismatched).toEqual([]);
  });
});
