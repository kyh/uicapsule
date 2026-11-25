const COLORS = [
  { label: "Background", token: "--background" },
  { label: "Foreground", token: "--foreground" },
  { label: "Card", token: "--card" },
  { label: "Muted", token: "--muted" },
  { label: "Border", token: "--border" },
  { label: "Primary", token: "--primary" },
  { label: "Secondary", token: "--secondary" },
  { label: "Accent", token: "--accent" },
  { label: "Destructive", token: "--destructive" },
];

const TYPE_SCALE = [
  { family: "heading", label: "Display", sample: "Aa", size: "text-6xl" },
  { family: "heading", label: "Heading", sample: "Set in motion", size: "text-3xl" },
  {
    family: "body",
    label: "Body",
    sample: "Every control reads from the same tokens.",
    size: "text-base",
  },
  { family: "body", label: "Caption", sample: "Updated 2 minutes ago", size: "text-sm" },
  { family: "mono", label: "Mono", sample: "--radius: 0.625rem", size: "text-sm" },
] as const;

const FAMILY_CLASS = {
  body: "font-(family-name:--ds-font-body)",
  heading: "font-(family-name:--ds-font-heading) tracking-(--ds-heading-tracking)",
  mono: "font-(family-name:--ds-font-mono)",
} as const;

const RADII = [
  { className: "rounded-sm", label: "sm" },
  { className: "rounded-md", label: "md" },
  { className: "rounded-lg", label: "lg" },
  { className: "rounded-xl", label: "xl" },
  { className: "rounded-full", label: "full" },
];

const SectionLabel = ({ children }: { children: string }) => (
  <h3 className="text-muted-foreground mb-4 font-(family-name:--ds-font-mono) text-xs tracking-widest uppercase">
    {children}
  </h3>
);

export const Foundations = () => (
  <div className="grid gap-12">
    <div>
      <SectionLabel>Color</SectionLabel>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
        {COLORS.map(({ label, token }) => (
          <li className="grid min-w-0 gap-2" key={token}>
            <div
              className="border-border aspect-square rounded-lg border-(length:--ds-border-width)"
              style={{ background: `var(${token})` }}
            />
            <div className="grid text-xs">
              <span className="truncate">{label}</span>
              <span className="text-muted-foreground truncate font-(family-name:--ds-font-mono)">
                {token}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>

    <div>
      <SectionLabel>Type</SectionLabel>
      <ul className="divide-border grid divide-y-(length:--ds-border-width)">
        {TYPE_SCALE.map(({ label, sample, size, family }) => (
          <li className="flex min-w-0 items-baseline gap-6 py-3" key={label}>
            <span className="text-muted-foreground w-20 shrink-0 font-(family-name:--ds-font-mono) text-xs">
              {label}
            </span>
            <span className={`${size} ${FAMILY_CLASS[family]} min-w-0 truncate`}>{sample}</span>
          </li>
        ))}
      </ul>
    </div>

    <div className="grid gap-12 sm:grid-cols-2">
      <div>
        <SectionLabel>Radius</SectionLabel>
        <ul className="flex flex-wrap gap-3">
          {RADII.map(({ label, className }) => (
            <li className="grid justify-items-center gap-2" key={label}>
              <div
                className={`bg-muted border-border size-14 border-(length:--ds-border-width) ${className}`}
              />
              <span className="text-muted-foreground font-(family-name:--ds-font-mono) text-xs">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <SectionLabel>Elevation</SectionLabel>
        <div className="bg-card text-card-foreground border-border grid h-14 place-items-center rounded-lg border-(length:--ds-border-width) text-sm shadow-(--ds-shadow)">
          --ds-shadow
        </div>
      </div>
    </div>
  </div>
);
