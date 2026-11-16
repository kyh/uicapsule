export const Avatar = ({ initials }: { initials: string }) => (
  <span className="bg-secondary text-secondary-foreground border-card grid size-9 place-items-center rounded-full border-2 text-xs font-semibold">
    {initials}
  </span>
);
