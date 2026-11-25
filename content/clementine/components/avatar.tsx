const TINTS = [
  "bg-[oklch(0.93_0.05_60)] text-[oklch(0.42_0.1_50)]",
  "bg-[oklch(0.93_0.04_150)] text-[oklch(0.4_0.08_150)]",
  "bg-[oklch(0.93_0.035_250)] text-[oklch(0.42_0.08_255)]",
  "bg-[oklch(0.93_0.04_320)] text-[oklch(0.42_0.09_320)]",
];

export const Avatar = ({ initials }: { initials: string }) => (
  <span
    className={`border-card grid size-10 place-items-center rounded-full border-2 text-sm font-semibold ${TINTS[[...initials].reduce((sum, char) => sum + (char.codePointAt(0) ?? 0), 0) % TINTS.length]}`}
  >
    {initials}
  </span>
);
