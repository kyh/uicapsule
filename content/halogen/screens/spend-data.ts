export interface TeamSpend {
  team: string;
  lead: string;
  credits: number;
  budget: number;
  october: number;
}

export const GROWTH: TeamSpend = {
  budget: 4800,
  credits: 5912,
  lead: "Ines Duarte",
  october: 4410,
  team: "growth-data",
};

export const TEAMS: TeamSpend[] = [
  GROWTH,
  { budget: 3600, credits: 3240, lead: "Priya Raman", october: 3385, team: "finance-data" },
  { budget: 2600, credits: 2104, lead: "Tomasz Wilk", october: 2290, team: "platform" },
  { budget: 2400, credits: 1630, lead: "Mei Lin Zhao", october: 1188, team: "ml-research" },
  { budget: 600, credits: 594, lead: "Rafael Ortiz", october: 402, team: "legal-ops" },
];

export const BUDGET = TEAMS.reduce<number>((sum, team) => sum + team.budget, 0);

export const SPENT = TEAMS.reduce<number>((sum, team) => sum + team.credits, 0);

export const DAY = 25;

export const DAYS = 30;

export const forecastOf = (credits: number) => Math.round((credits / DAY) * DAYS);

export const QUEUE_DEPTH = [
  { label: "09:00", value: 2 },
  { label: "09:05", value: 3 },
  { label: "09:10", value: 2 },
  { label: "09:15", value: 6 },
  { label: "09:20", value: 9 },
  { label: "09:25", value: 14 },
  { label: "09:30", value: 11 },
  { label: "09:35", value: 17 },
  { label: "09:40", value: 23 },
  { label: "09:45", value: 20 },
  { label: "09:50", value: 16 },
  { label: "09:55", value: 19 },
];

export interface Spill {
  id: string;
  team: string;
  spilled: number;
  rows: string;
  memory: number;
  step: string;
}

export const SPILLS: Spill[] = [
  {
    id: "q_7f21c0",
    memory: 64,
    rows: "2.1B",
    spilled: 186,
    step: "Sort on (account_id, event_ts)",
    team: "growth-data",
  },
  {
    id: "q_a90c44",
    memory: 64,
    rows: "640M",
    spilled: 121,
    step: "Hash join to events.sessions",
    team: "ml-research",
  },
  {
    id: "q_33de18",
    memory: 32,
    rows: "212M",
    spilled: 64,
    step: "Window over 400 days",
    team: "finance-data",
  },
  {
    id: "q_c4b207",
    memory: 32,
    rows: "98M",
    spilled: 41,
    step: "Distinct on contact_id",
    team: "growth-data",
  },
];

export const AT_CAP = [
  {
    description: "New queries wait until the 1st. Running ones finish.",
    label: "Queue new queries",
    value: "queue",
  },
  {
    description: "Overflow runs on wh-burst-xs at a third of the rate.",
    label: "Route to wh-burst-xs",
    value: "burst",
  },
  {
    description: "Nothing stops. The team lead is paged once.",
    label: "Page the lead only",
    value: "page",
  },
] as const;

export type AtCap = (typeof AT_CAP)[number]["value"];
