import type { RunStatus } from "../components/status";

export interface Run {
  id: string;
  pipeline: string;
  status: RunStatus;
  trigger: string;
  started: string;
  seconds: number | null;
  rows: number | null;
  owner: string;
}

export const OWNERS = [
  { label: "All owners", value: "all" },
  { label: "Finance data", meta: "4", value: "finance" },
  { label: "Growth", meta: "3", value: "growth" },
  { label: "Platform", meta: "4", value: "platform" },
] as const;

export type Owner = (typeof OWNERS)[number]["value"];

export const RUNS: (Run & { team: Exclude<Owner, "all"> })[] = [
  {
    id: "run_9b20f3",
    owner: "Priya Raman",
    pipeline: "ledger.entries_daily",
    rows: 1_482_906,
    seconds: 401,
    started: "03:12",
    status: "fail",
    team: "finance",
    trigger: "Schedule",
  },
  {
    id: "run_8b71d3",
    owner: "Kwame Asante",
    pipeline: "ads.spend_rollup",
    rows: 0,
    seconds: 44,
    started: "13:15",
    status: "fail",
    team: "growth",
    trigger: "Schedule",
  },
  {
    id: "run_4e18aa",
    owner: "Ines Duarte",
    pipeline: "crm.accounts_sync",
    rows: 88_412,
    seconds: 124,
    started: "13:30",
    status: "warn",
    team: "growth",
    trigger: "Schedule",
  },
  {
    id: "run_7c41e0",
    owner: "Priya Raman",
    pipeline: "billing.invoices_hourly",
    rows: 1_187_530,
    seconds: 312,
    started: "14:02",
    status: "running",
    team: "finance",
    trigger: "Schedule",
  },
  {
    id: "run_c2d907",
    owner: "Tomasz Wilk",
    pipeline: "events.clickstream_compact",
    rows: 48_920_331,
    seconds: 750,
    started: "13:55",
    status: "running",
    team: "platform",
    trigger: "Schedule",
  },
  {
    id: "run_a1f6b2",
    owner: "Mei Lin Zhao",
    pipeline: "ml.feature_store_refresh",
    rows: 6_031_544,
    seconds: 1104,
    started: "13:48",
    status: "running",
    team: "platform",
    trigger: "Manual",
  },
  {
    id: "run_5d33e1",
    owner: "Tomasz Wilk",
    pipeline: "geo.tiles_rebuild",
    rows: null,
    seconds: null,
    started: "14:10",
    status: "queued",
    team: "platform",
    trigger: "Backfill",
  },
  {
    id: "run_6aa2c8",
    owner: "Ines Duarte",
    pipeline: "inventory.stock_levels",
    rows: null,
    seconds: null,
    started: "14:15",
    status: "queued",
    team: "growth",
    trigger: "Schedule",
  },
  {
    id: "run_e07b4c",
    owner: "Rafael Ortiz",
    pipeline: "finance.fx_rates_pull",
    rows: 2310,
    seconds: 18,
    started: "14:00",
    status: "ok",
    team: "finance",
    trigger: "Schedule",
  },
  {
    id: "run_0f9a52",
    owner: "Mei Lin Zhao",
    pipeline: "support.tickets_snapshot",
    rows: 214_007,
    seconds: 112,
    started: "13:40",
    status: "ok",
    team: "platform",
    trigger: "Schedule",
  },
  {
    id: "run_31be07",
    owner: "Rafael Ortiz",
    pipeline: "finance.revenue_marts",
    rows: 9884,
    seconds: 263,
    started: "13:20",
    status: "ok",
    team: "finance",
    trigger: "Upstream",
  },
];

export const NIGHTS = [
  { label: "Nov 11", value: 38_204_118 },
  { label: "Nov 12", value: 39_880_412 },
  { label: "Nov 13", value: 37_511_906 },
  { label: "Nov 14", value: 41_022_310 },
  { label: "Nov 15", value: 29_310_554 },
  { label: "Nov 16", value: 27_908_101 },
  { label: "Nov 17", value: 42_617_390 },
  { label: "Nov 18", value: 43_105_877 },
  { label: "Nov 19", value: 44_390_012 },
  { label: "Nov 20", value: 40_877_245 },
  { label: "Nov 21", value: 45_216_903 },
  { label: "Nov 22", value: 31_442_760 },
  { label: "Nov 23", value: 30_118_224 },
  { label: "Nov 24", value: 46_903_517 },
];

export const SYNC_LANES = [
  { id: "pg", label: "orders-db" },
  { id: "kafka", label: "cdc stream" },
  { id: "lake", label: "lakehouse" },
  { id: "wh", label: "warehouse" },
  { id: "bi", label: "dashboards" },
];

export const SYNC_STEPS = [
  {
    activity: "Snapshotting 41 tables from orders-db",
    from: "pg",
    label: "Snapshot",
    meta: "41 tables",
  },
  {
    activity: "Streaming changes since 02:00 into 6 topics",
    from: "pg",
    label: "Stream changes",
    meta: "6 topics",
    to: "kafka",
  },
  {
    activity: "Landing 1,912 parquet files in the lakehouse",
    from: "kafka",
    label: "Land files",
    meta: "1,912 files",
    to: "lake",
  },
  {
    activity: "Merging into core.customers with dedupe",
    from: "lake",
    label: "Merge",
    meta: "core.customers",
    to: "wh",
  },
  { activity: "Building 18 customer models", from: "wh", label: "Build marts", meta: "18 models" },
  {
    activity: "Refreshing Revenue and Churn dashboards",
    from: "wh",
    label: "Refresh",
    meta: "2 boards",
    to: "bi",
  },
] as const;
