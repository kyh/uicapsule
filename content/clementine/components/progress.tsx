import { useId } from "react";

export const Progress = ({ label, value }: { label: string; value: number }) => {
  const id = useId();

  return (
    <div className="grid gap-1.5">
      <div className="flex justify-between text-xs">
        <label htmlFor={id}>{label}</label>
        <span className="text-muted-foreground font-(family-name:--ds-font-mono)">{value}%</span>
      </div>
      <progress
        className="bg-muted [&::-moz-progress-bar]:bg-accent [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-accent h-2 w-full appearance-none overflow-hidden rounded-full [&::-moz-progress-bar]:rounded-full [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-[width] [&::-webkit-progress-value]:duration-(--ds-duration)"
        id={id}
        max={100}
        value={value}
      />
    </div>
  );
};
