"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, Plus } from "lucide-react";

import { Alert } from "./components/alert";
import { Avatar } from "./components/avatar";
import { Badge } from "./components/badge";
import { Button } from "./components/button";
import { Card } from "./components/card";
import { Checkbox } from "./components/checkbox";
import { Input } from "./components/input";
import { Progress } from "./components/progress";
import { Segmented } from "./components/segmented";
import { Switch } from "./components/switch";
import { Foundations } from "./foundations";
import { system } from "./system";

const RANGES = ["Day", "Week", "Month"] as const;

const Section = ({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: ReactNode;
}) => (
  <section className="border-border grid gap-8 border-t-(length:--ds-border-width) py-12">
    <h2 className="flex items-baseline gap-3 font-(family-name:--ds-font-heading) text-2xl tracking-(--ds-heading-tracking)">
      <span className="text-muted-foreground font-(family-name:--ds-font-mono) text-xs">
        {index}
      </span>
      {title}
    </h2>
    {children}
  </section>
);

const Specimen = ({ title, children }: { title: string; children: ReactNode }) => (
  <Card className="grid content-start gap-5">
    <h3 className="text-muted-foreground font-(family-name:--ds-font-mono) text-xs tracking-widest uppercase">
      {title}
    </h3>
    {children}
  </Card>
);

const Components = () => {
  const [notify, setNotify] = useState(true);
  const [sync, setSync] = useState(false);
  const [terms, setTerms] = useState(true);
  const [range, setRange] = useState<(typeof RANGES)[number]>("Week");

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Specimen title="Button">
        <div className="flex flex-wrap items-center gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="accent">Accent</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Small</Button>
          <Button aria-label="Add" size="icon" variant="outline">
            <Plus aria-hidden className="size-4" />
          </Button>
          <Button disabled>Disabled</Button>
        </div>
      </Specimen>

      <Specimen title="Input">
        <Input label="Email" placeholder="you@example.com" type="email" />
        <Input
          defaultValue="Northwind"
          hint="Visible to everyone in the workspace."
          label="Workspace"
        />
      </Specimen>

      <Specimen title="Selection">
        <Switch checked={notify} label="Notifications" onCheckedChange={setNotify} />
        <Switch checked={sync} label="Background sync" onCheckedChange={setSync} />
        <Checkbox checked={terms} label="Accept terms" onCheckedChange={setTerms} />
        <Segmented label="Range" onValueChange={setRange} options={RANGES} value={range} />
      </Specimen>

      <Specimen title="Status">
        <div className="flex flex-wrap gap-2">
          <Badge>Draft</Badge>
          <Badge variant="accent">Live</Badge>
          <Badge variant="outline">Beta</Badge>
          <Badge variant="destructive">Failed</Badge>
        </div>
        <Progress label="Storage" value={64} />
      </Specimen>

      <Specimen title="Feedback">
        <Alert title="Payment failed">
          Your card was declined. Update billing to keep the workspace active.
        </Alert>
      </Specimen>

      <Specimen title="Identity">
        <div className="flex -space-x-2">
          {["AL", "MK", "JS", "RT"].map((initials) => (
            <Avatar initials={initials} key={initials} />
          ))}
        </div>
      </Specimen>
    </div>
  );
};

const InContext = () => {
  const [shared, setShared] = useState(false);

  return (
    <Card className="mx-auto grid w-full max-w-md gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <h3 className="font-(family-name:--ds-font-heading) text-xl tracking-(--ds-heading-tracking)">
            Q3 launch plan
          </h3>
          <p className="text-muted-foreground text-sm">12 tasks · due in 4 days</p>
        </div>
        <Badge variant="accent">On track</Badge>
      </div>
      <Progress label="Complete" value={72} />
      <div className="flex items-center justify-between">
        <div className="flex -space-x-2">
          {["AL", "MK", "JS"].map((initials) => (
            <Avatar initials={initials} key={initials} />
          ))}
        </div>
        <Switch checked={shared} label="Share link" onCheckedChange={setShared} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost">Archive</Button>
        <Button>
          Open board
          <ArrowRight aria-hidden className="size-4" />
        </Button>
      </div>
    </Card>
  );
};

export const DesignSystem = () => (
  <div className="ds-vellum min-h-dvh antialiased">
    <div className="mx-auto max-w-6xl px-6 sm:px-10">
      <header className="grid gap-4 py-16">
        <p className="text-muted-foreground font-(family-name:--ds-font-mono) text-xs tracking-widest uppercase">
          Design system
        </p>
        <h1 className="font-(family-name:--ds-font-heading) text-5xl tracking-(--ds-heading-tracking) sm:text-7xl">
          {system.name}
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg text-pretty">{system.tagline}</p>
      </header>
      <Section index="01" title="Foundations">
        <Foundations />
      </Section>
      <Section index="02" title="Components">
        <Components />
      </Section>
      <Section index="03" title="In context">
        <InContext />
      </Section>
    </div>
  </div>
);
