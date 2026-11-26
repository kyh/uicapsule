import type { DriftRow } from "../components/schema-diff";

export type Resolution =
  | "alias"
  | "keep-both"
  | "cast"
  | "accept-text"
  | "add"
  | "ignore"
  | "backfill"
  | "null";

export const DRIFT_ROWS: DriftRow<Resolution>[] = [
  {
    after: { name: "phone_e164", type: "text" },
    before: { name: "phone", type: "text" },
    id: "phone",
    kind: "renamed",
    options: [
      { label: "Alias back to phone", value: "alias" },
      { label: "Keep both names", value: "keep-both" },
    ],
  },
  {
    after: { name: "lifetime_value", type: "text" },
    before: { name: "lifetime_value", type: "numeric(12,2)" },
    id: "ltv",
    kind: "retyped",
    options: [
      { label: "Cast to numeric(12,2)", value: "cast" },
      { label: "Accept text", value: "accept-text" },
    ],
  },
  {
    after: { name: "consent_ts", type: "timestamptz" },
    id: "consent",
    kind: "added",
    options: [
      { label: "Add to core.contacts", value: "add" },
      { label: "Leave in raw only", value: "ignore" },
    ],
  },
  {
    before: { name: "region", type: "text" },
    id: "region",
    kind: "dropped",
    options: [
      { label: "Backfill from core.accounts", value: "backfill" },
      { label: "Write null", value: "null" },
    ],
  },
];

export const DEFAULT_CHOICES = {
  consent: "add",
  ltv: "cast",
  phone: "alias",
  region: "backfill",
} satisfies Record<string, Resolution>;

const PHONE = {
  alias: "  phone_e164 AS phone,",
  "keep-both": "  phone_e164 AS phone, phone_e164,",
} as const;

const LTV = {
  "accept-text": "  lifetime_value,",
  cast: "  CAST(lifetime_value AS numeric(12,2)) AS lifetime_value,",
} as const;

const REGION = {
  backfill: "  a.region AS region",
  null: "  NULL AS region",
} as const;

/** The mapping view the current choices generate, with the line numbers each choice wrote. */
export const mappingSql = (choices: Record<string, Resolution>) => {
  const phone = choices.phone === "keep-both" ? PHONE["keep-both"] : PHONE.alias;
  const ltv = choices.ltv === "accept-text" ? LTV["accept-text"] : LTV.cast;
  const consent = choices.consent === "ignore" ? null : "  consent_ts,";
  const region = choices.region === "null" ? REGION.null : REGION.backfill;
  const join = choices.region === "null" ? null : "LEFT JOIN core.accounts a USING (account_id)";

  const lines = [
    "-- core.contacts from crm-api v7, written by drift_4ac1",
    "CREATE OR REPLACE VIEW staging.contacts_v7_map AS",
    "SELECT",
    "  c.contact_id,",
    "  c.account_id,",
    phone,
    ltv,
    ...(consent ? [consent] : []),
    region,
    "FROM raw.crm_contacts_v7 c",
    ...(join ? [join] : []),
  ];

  const changed = [phone, ltv, consent, region].flatMap((line) =>
    line !== null && line !== "" ? [lines.indexOf(line) + 1] : [],
  );

  return { changed, code: `${lines.join("\n")};` };
};

export const HELD_MODELS = [
  { name: "core.contacts", owner: "growth-data" },
  { name: "marts.customer_360", owner: "growth-data" },
  { name: "marts.churn_weekly", owner: "growth-data" },
  { name: "marts.ltv_cohorts", owner: "finance-data" },
  { name: "marts.consent_audit", owner: "legal-ops" },
  { name: "exports.ads_audiences", owner: "growth-data" },
  { name: "exports.support_routing", owner: "platform" },
];

export const QUARANTINED = 41_806;
