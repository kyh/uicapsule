import { useId } from "react";

export const Progress = ({ label, value }: { label: string; value: number }) => {
  const id = useId();

  return (
    <div className="grid gap-1.5">
      <div className="flex justify-between text-xs">
        <label className="font-medium" htmlFor={id}>
          {label}
        </label>
        <span className="text-muted-foreground tabular-nums">{value}%</span>
      </div>
      <progress
        className="bg-secondary [&::-moz-progress-bar]:bg-(--ds-ink) [&::-webkit-progress-bar]:bg-secondary [&::-webkit-progress-value]:bg-(--ds-ink) h-1 w-full appearance-none overflow-hidden rounded-full [&::-moz-progress-bar]:rounded-full [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-[width] [&::-webkit-progress-value]:duration-(--ds-duration)"
        id={id}
        max={100}
        value={value}
      />
    </div>
  );
};
