export const Avatar = ({ initials }: { initials: string }) => (
  <span className="bg-muted text-foreground border-card grid size-8 place-items-center border-2 font-(family-name:--ds-font-mono) text-[11px] tracking-[0.04em]">
    {initials}
  </span>
);
