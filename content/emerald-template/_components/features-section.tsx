import React from "react";
import { cn } from "@repo/ui/utils";
import {
  ClipboardCheckIcon,
  EyeIcon,
  KeyIcon,
  LockIcon,
  SearchIcon,
  TerminalSquareIcon,
  UserIcon,
  XIcon,
} from "lucide-react";

import { HighlightCard } from "./highlight-card";

const SourceIcon = ({
  Icon,
  id,
  className,
}: {
  Icon?: React.JSXElementConstructor<any>;
  id?: string;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "inline-flex justify-center rounded-full border border-dashed border-zinc-700 bg-zinc-900 p-3 text-white",
        className,
      )}
    >
      {Icon && <Icon className="size-5" />}
      {id && (
        <img
          alt={id}
          width={20}
          height={20}
          className="size-5"
          src={`https://zmdrwswxugswzmcokvff.supabase.co/storage/v1/object/public/uicapsule/emerald-template/${id}.svg`}
        />
      )}
    </div>
  );
};

const HomeCard = ({
  className,
  title,
  description,
  inline,
  pattern,
  children,
}: {
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  inline?: boolean;
  pattern?: React.ReactNode;
  children?: React.ReactNode;
}) => {
  return (
    <HighlightCard
      // size="lg"
      className={cn("grow", className)}
      pattern={pattern}
      gridProps={{
        y: -6,
        squares: [
          [-1, 2],
          [1, 3],
        ],
      }}
    >
      <div
        className={cn(
          "flex h-full items-center gap-5 text-center lg:gap-8 lg:text-start",
          inline ? "flex-col" : "flex-col lg:flex-row",
        )}
      >
        <div className="flex min-w-[300px] shrink-0 flex-col gap-2 lg:gap-5">
          <h3 className="text-xl font-semibold sm:text-2xl">{title}</h3>
          <div className="text-start text-sm text-zinc-300 sm:text-base">
            {description}
          </div>
        </div>
        {children}
      </div>
    </HighlightCard>
  );
};

const HomeCardDescriptionList = ({ points }: { points: React.ReactNode[] }) => (
  <ul className="flex flex-col gap-1">
    {points.map((point, index) => (
      <li className="flex items-start gap-2.5" key={index}>
        <svg
          className="mt-1.5 h-4 w-4 flex-none text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        {point}
      </li>
    ))}
  </ul>
);

export const FeaturesSection = () => {
  return (
    <div className="mt-8 flex flex-col gap-8 lg:flex-row">
      <HomeCard
        title="Prebuilt templates"
        description={
          <HomeCardDescriptionList
            points={[
              "Created by top operators",
              "Customize them to fit your needs",
              "Share them with your team",
            ]}
          />
        }
        inline
      >
        <div className="relative h-80 w-full rounded-2xl border border-dashed border-zinc-700">
          <SearchIcon className="absolute top-4 left-6 h-4 w-4 text-zinc-700" />
          <XIcon className="absolute top-4 right-6 h-4 w-4 text-zinc-700" />
          <p className="absolute top-[14px] left-12 text-sm text-zinc-700">
            Build a churn analysis dashboard
          </p>
          <div className="absolute inset-x-4 inset-y-0 z-10 border-x border-dashed border-zinc-700" />
          <div className="absolute inset-x-0 top-0 h-12 border-b border-dashed border-zinc-700" />
          <div className="absolute inset-x-0 bottom-0 z-0 flex h-10 flex-row items-center gap-2 overflow-hidden border-t border-dashed border-zinc-700 px-6 text-xs text-zinc-700">
            <div className="rounded-md border border-dashed border-zinc-700 px-2 py-1 whitespace-nowrap">
              Reference 1
            </div>
            <div className="rounded-md border border-dashed border-zinc-700 px-2 py-1 whitespace-nowrap">
              Reference 2
            </div>
          </div>
          <div className="absolute inset-x-8 inset-y-16 flex animate-pulse flex-col gap-4">
            <div className="h-2 w-4/5 rounded bg-zinc-700" />
            <div className="h-2 w-2/3 rounded bg-zinc-700" />
            <div className="h-2 w-1/3 rounded bg-zinc-700" />
            <div className="h-2 w-1/2 rounded bg-zinc-700" />
          </div>
        </div>
      </HomeCard>
      <HomeCard
        className="overflow-hidden text-xs"
        title="Private and secure by default"
        description={
          <HomeCardDescriptionList
            points={[
              "Built in permission and access control",
              "End to end encryption",
              "BYO database, model, or interface",
            ]}
          />
        }
        pattern={
          <div className="pointer-events-none absolute top-0 left-0 w-full bg-gradient-to-b from-transparent to-zinc-800 bg-clip-text font-mono text-xs leading-4 tracking-[4px] break-all text-transparent">
            0000101001010011011001010110001101110101011100100110100101110100011110010010000001100001011011100110010000100000010100000111001001101001011101100110000101100011011110010000101001010000011100100110100101110110011000010110001101111001001000000110000101101110011001000010000001110011011001010110001101110101011100100110100101110100011110010010000001100001011100100110010100100000011101000110111101101111001000000110100101101101011100000110111101110010011101000110000101101110011101000010000001100110011011110111001000100000011011000110010101100111011000010110110001100101011100110110010100100000010000110110110001100001011110010010000001100100011011110110010101110011001000000110111001101111011101000010000000001010010100110110010101100011011101010111001001101001011101000111100100100000011000010110111001100100001000000101000001110010011010010111011001100001011000110111100100001010010100000111001001101001011101100110000101100011011110010010000001100001011011100110010000100000011100110110010101100011011101010111001001101001011101000111100100100000011000010111001001100101001000000111010001101111011011110010000001101001011011010111000001101111011100100111010001100001011011100111010000100000011001100110111101110010001000000110110001100101011001110110000101101100011001010111001101100101001000000100001101101100011000010111100100100000011001000110111101100101011100110010000001101110011011110111010000100000000010100101001101100101011000110111010101110010011010010111010001111001001000000110000101101110011001000010000001010000011100100110100101110110011000010110001101111001000010100101000001110010011010010111011001100001011000110111100100100000011000010110111001100110111101110010001000000110110001100101011001110110000101101100011001010111001101100101001000000100001101101100011000010111100100100000011001000110111101100101011100110010000001101110011011110111010000100000000010100101001101100101011000110111010101110010011010010111010001111001001000000110000101101110011001000010000001010000011100100110100101110110011000010110001101111001000010100101000001110010011010010111011001100001011000110111100100100000011000010110110100110100101110110011000010110001101111001001000000110000101101101001101001011101100110000101100011011110010010000001100001011011
          </div>
        }
        inline
      >
        <div className="mt-10 grid w-full grid-cols-3 gap-5">
          <div className="flex flex-col items-center">
            <SourceIcon className="rounded" Icon={KeyIcon} />
            Secure
          </div>
          <div className="flex flex-col items-center">
            <SourceIcon className="rounded" Icon={LockIcon} />
            Encrypted
          </div>
          <div className="flex flex-col items-center">
            <SourceIcon className="rounded" Icon={ClipboardCheckIcon} />
            Compliant
          </div>
          <div className="flex flex-col items-center">
            <SourceIcon className="rounded" Icon={UserIcon} />
            Access Control
          </div>
          <div className="flex flex-col items-center">
            <SourceIcon className="rounded" Icon={EyeIcon} />
            Observable
          </div>
          <div className="flex flex-col items-center">
            <SourceIcon className="rounded" Icon={TerminalSquareIcon} />
            Scriptable
          </div>
        </div>
      </HomeCard>
    </div>
  );
};
