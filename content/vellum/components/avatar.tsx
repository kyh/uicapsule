export const Avatar = ({ initials }: { initials: string }) => (
  <span className="bg-muted text-muted-foreground border-card grid size-8 place-items-center rounded-full border-2 text-[11px] font-medium">
    {initials}
  </span>
);
