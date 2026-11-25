import { useId } from "react";

const BLOCKS = 20;

export const Progress = ({ label, value }: { label: string; value: number }) => {
  const id = useId();
  const lit = Math.round((value / 100) * BLOCKS);

  return (
    <div className="grid gap-1.5">
      <div className="flex justify-between font-(family-name:--ds-font-mono) text-xs tracking-[0.04em]">
        <label htmlFor={id}>{label}</label>
        <span className="text-muted-foreground">{value}%</span>
      </div>
      <progress className="sr-only" id={id} max={100} value={value} />
      <div aria-hidden className="grid h-2 grid-cols-20 gap-0.5">
        {Array.from({ length: BLOCKS }, (_, index) => (
          <span
            className={`transition-colors duration-(--ds-duration) ${index < lit ? "bg-foreground" : "bg-muted"}`}
            key={index}
          />
        ))}
      </div>
    </div>
  );
};
