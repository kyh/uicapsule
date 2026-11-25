import type { ReactNode } from "react";
import { CopyButton } from "@repo/ui/components/copy-button";
import { CodeSnippet } from "@/components/code-snippet";
import { JsonLd } from "@/components/json-ld";
import {
  canonicalAlternates,
  pageOpenGraph,
  pageTwitter,
  shareCardImage,
} from "@/lib/agent/page-metadata";
import {
  mcpFaq,
  mcpGuarantees,
  mcpInstallSteps,
  mcpJobs,
  mcpPage,
  mcpPrompts,
  slugifyHeading,
} from "@/lib/agent/site-pages";
import { buildProsePageGraph } from "@/lib/agent/structured-data";

import { Inline } from "../_components/prose-page";
import { CopyPromptButton } from "./copy-prompt-button";

import type { Metadata } from "next";

const image = shareCardImage(mcpPage.path, mcpPage.title);

export const metadata: Metadata = {
  alternates: canonicalAlternates(mcpPage.path),
  description: mcpPage.description,
  openGraph: pageOpenGraph(mcpPage.path, {
    description: mcpPage.description,
    image,
    title: mcpPage.title,
  }),
  title: mcpPage.title,
  twitter: pageTwitter({ description: mcpPage.description, image, title: mcpPage.title }),
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-5">
    <h2 id={slugifyHeading(title)} className="text-foreground scroll-mt-20 text-lg">
      {title}
    </h2>
    {children}
  </section>
);

const Page = () => (
  <>
    <JsonLd node={buildProsePageGraph(mcpPage)} />
    <main className="flex max-w-3xl flex-col gap-14 p-8 select-text lg:p-20">
      <header className="flex flex-col gap-5">
        <h1 className="text-3xl leading-snug text-balance lg:text-4xl">{mcpPage.heading}</h1>
        <p className="text-muted-foreground text-lg leading-relaxed text-pretty">
          {mcpPage.description}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <CopyPromptButton />
          <span className="text-muted-foreground text-sm">
            Paste it into your agent and it sets itself up.
          </span>
        </div>
      </header>

      <Section title="Install">
        <ol className="flex flex-col gap-6">
          {mcpInstallSteps.map((step, index) => (
            <li key={step.title} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-3">
              <span className="bg-muted text-foreground flex size-6 items-center justify-center rounded-full font-mono text-xs tabular-nums">
                {index + 1}
              </span>
              <div className="flex min-w-0 flex-col gap-2">
                <h3 className="text-foreground leading-6 font-medium">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  <Inline text={step.text} />
                </p>
                {step.code && <CodeSnippet text={step.code.text} label={step.code.label} />}
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="What your agent gets">
        <div className="grid gap-3 sm:grid-cols-2">
          {mcpJobs.map((job) => (
            <div key={job.title} className="flex flex-col gap-2 rounded-lg border p-4">
              <h3 className="text-foreground font-medium">{job.title}</h3>
              <p className="text-muted-foreground flex-1 text-sm leading-relaxed">{job.text}</p>
              <ul className="flex flex-wrap gap-1.5 pt-1">
                {job.names.map((name) => (
                  <li
                    key={name}
                    className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Prompts to try">
        <ul className="divide-y rounded-lg border">
          {mcpPrompts.map((prompt) => (
            <li key={prompt.title} className="flex items-center gap-3 py-2 pr-2 pl-4">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:gap-3">
                <span className="text-muted-foreground w-24 shrink-0 text-sm">{prompt.title}</span>
                <span className="text-foreground text-sm">{prompt.text}</span>
              </div>
              <CopyButton value={prompt.text} label={`Copy the ${prompt.title} prompt`} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Read-only, no key">
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {mcpGuarantees.map((guarantee) => (
            <div key={guarantee.title} className="flex flex-col gap-1">
              <dt className="text-foreground font-medium">{guarantee.title}</dt>
              <dd className="text-muted-foreground text-sm leading-relaxed">
                <Inline text={guarantee.text} />
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Questions">
        <div className="flex flex-col gap-6">
          {mcpFaq.map((entry) => (
            <div key={entry.title} className="flex flex-col gap-1.5">
              <h3 id={slugifyHeading(entry.title)} className="text-foreground font-medium">
                {entry.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                <Inline text={entry.text} />
              </p>
            </div>
          ))}
        </div>
      </Section>
    </main>
  </>
);

export default Page;
