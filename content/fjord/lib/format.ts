const numberFormat = new Intl.NumberFormat("en-US");

export const formatNumber = (value: number) => numberFormat.format(value);

export const formatMs = (ms: number) => {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }

  if (ms < 60_000) {
    return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)}s`;
  }

  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);

  return `${minutes}m ${seconds}s`;
};

export const formatClock = (totalSeconds: number) => {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const formatAgo = (seconds: number) => {
  if (seconds < 45) {
    return "just now";
  }

  if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);

    return `${minutes} min ago`;
  }

  if (seconds < 86_400) {
    const hours = Math.round(seconds / 3600);

    return `${hours} h ago`;
  }

  const days = Math.round(seconds / 86_400);

  return days === 1 ? "yesterday" : `${days} days ago`;
};

export const initials = (name: string) =>
  name
    .split(/[\s_-]+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
