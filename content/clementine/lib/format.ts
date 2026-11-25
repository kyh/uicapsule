const money = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

const moneyWhole = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

/** Formats a signed amount in dollars: a minus for money out, an optional plus for money in. */
export const formatAmount = (
  value: number,
  { signed = false, compact = false }: { signed?: boolean; compact?: boolean } = {},
) => {
  if (!Number.isFinite(value)) {
    return "Unavailable";
  }

  const body = (compact ? moneyWhole : money).format(Math.abs(value));

  if (value < 0) {
    return `−${body}`;
  }

  return signed && value > 0 ? `+${body}` : body;
};

/** Spells an amount for screen readers, such as "minus 45.00 dollars". */
export const spokenAmount = (value: number) => {
  if (!Number.isFinite(value)) {
    return "Unavailable";
  }

  const sign = value < 0 ? "minus " : "";

  return `${sign}${Math.abs(value).toFixed(2)} dollars`;
};

export type Affordability = "unknown" | "comfortable" | "tight" | "insufficient";

/** Rates a payment against the money available: tight when under a fifth would remain, insufficient when it would not clear. */
export const amountAffordability = (value: number, available?: number | null) => {
  if (available === undefined || available === null || !Number.isFinite(available)) {
    return "unknown" satisfies Affordability;
  }

  const out = Math.abs(Math.min(value, 0));

  if (out > available) {
    return "insufficient" satisfies Affordability;
  }

  if (out > 0 && available - out < available * 0.2) {
    return "tight" satisfies Affordability;
  }

  return "comfortable" satisfies Affordability;
};
