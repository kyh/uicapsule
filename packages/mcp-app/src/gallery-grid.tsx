import { CoverMedia } from "./cover-media";

import type { GalleryEntry } from "./gallery-schema";

const GalleryCard = ({
  entry,
  index,
  onOpen,
}: {
  entry: GalleryEntry;
  index: number;
  onOpen: (entry: GalleryEntry) => void;
}) => (
  <button
    className="bg-background group flex shadow-[0_0_0_1px_var(--color-border)] flex-col justify-between gap-3 p-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
    onClick={() => {
      onOpen(entry);
    }}
    type="button"
  >
    <CoverMedia className="group-first:sm:aspect-auto group-first:sm:flex-1" cover={entry.cover} />
    <span className="flex justify-between gap-2 font-mono text-xs uppercase">
      <span className="group-hover:text-primary truncate transition">{entry.name}</span>
      <span className="text-muted-foreground/50 group-hover:text-primary/50 transition">
        {String(index + 1).padStart(3, "0")}
      </span>
    </span>
  </button>
);

/** The site's gallery grid: hairline gaps, the first card featured at twice the size. */
export const GalleryGrid = ({
  components,
  onOpen,
}: {
  components: GalleryEntry[];
  onOpen: (entry: GalleryEntry) => void;
}) => (
  <div className="grid grid-cols-1 gap-px overflow-hidden sm:grid-cols-3 sm:[&>*:first-child]:col-span-2 sm:[&>*:first-child]:row-span-2">
    {components.map((entry, index) => (
      <GalleryCard key={entry.slug} entry={entry} index={index} onOpen={onOpen} />
    ))}
  </div>
);
