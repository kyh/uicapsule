import React from "react";

import { GridPattern } from "./grid-pattern";
import { HeroExample } from "./hero-example";

const HeroPattern = () => {
  return (
    <div className="absolute inset-0 -z-10 [mask-image:linear-gradient(white,transparent_75%)]">
      <GridPattern
        width={72}
        height={56}
        x="-12"
        y="4"
        squares={[
          [4, 3],
          [2, 1],
          [7, 3],
          [10, 6],
        ]}
        className="h-full w-full fill-white/[0.025] stroke-white/5 mix-blend-overlay"
      />
    </div>
  );
};

export const HeroSection = () => {
  return (
    <>
      <HeroPattern />
      <section className="px-5 pt-[70px] sm:pt-[100px]">
        <h1 className="mx-auto mt-3 max-w-xl text-3xl font-semibold sm:text-4xl">
          <span className="block bg-gradient-to-b from-emerald-300 to-green-600 bg-clip-text text-transparent">
            Generate software products
          </span>
          <span>on your organization data</span>
        </h1>
        <p className="mx-auto mt-6 max-w-md text-base whitespace-pre-line text-zinc-400">
          Everyone on your team should be able to build software to automate
          their own day to day workflows
        </p>
        <div className="mt-8 grid items-start justify-center gap-4">
          <a className="group relative text-xs" href="">
            <div className="animate-tilt absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 opacity-75 blur transition group-hover:opacity-100" />
            <div className="relative flex items-center rounded-full bg-black bg-gradient-to-t from-zinc-900 px-7 py-2.5 text-emerald-400 transition group-hover:text-zinc-100">
              Start Building &rarr;
            </div>
          </a>
          <span className="text-muted-foreground text-sm">See samples</span>
        </div>
      </section>
      <div className="full-bleed relative">
        <video
          preload="metadata"
          loop
          autoPlay
          muted
          playsInline
          className="pointer-events-none absolute inset-0 w-full translate-y-10 [mask-image:linear-gradient(transparent_10%,black,transparent)] opacity-50 mix-blend-lighten hue-rotate-[250deg]"
        >
          <source src="https://zmdrwswxugswzmcokvff.supabase.co/storage/v1/object/public/uicapsule/emerald-template/home-hero-bg.mov" />
        </video>
        <HeroExample />
      </div>
    </>
  );
};
