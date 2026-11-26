const compact = new Intl.NumberFormat("en", { maximumFractionDigits: 1, notation: "compact" });
const exact = new Intl.NumberFormat("en");

/** 1.2M, 48K: a count short enough for a block or a stem. */
export const short = (value: number) => compact.format(value);

/** 1,482,906: a count as written. */
export const full = (value: number) => exact.format(value);

/** 3m 12s from seconds. */
export const duration = (seconds: number) => {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  if (minutes < 60) {
    return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
  }

  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

/** 03:12:07 from seconds since midnight. */
export const clock = (seconds: number) =>
  [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
