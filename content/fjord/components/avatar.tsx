export const Avatar = ({ initials }: { initials: string }) => (
  <span className="text-accent-foreground border-card grid size-8 place-items-center rounded-full border-2 bg-(--ds-accent-wash) text-[11px] font-[460]">
    {initials}
  </span>
);
