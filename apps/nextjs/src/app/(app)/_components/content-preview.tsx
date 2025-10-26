import Image from "next/image";
import Link from "next/link";
import { Badge } from "@repo/ui/badge";

export type ContentPreviewProps = {
  slug: string;
  name: string;
  index: number;
  tags: string[];
  coverUrl?: string;
  coverType?: "image" | "video";
};

export const ContentPreview = ({
  slug,
  name,
  index,
  tags,
  coverUrl,
  coverType,
}: ContentPreviewProps) => {
  return (
    <Link
      className="bg-background group flex flex-col justify-between gap-3 p-3 text-lg sm:p-6"
      href={`/ui/${slug}`}
    >
      <div className="aspect-video overflow-hidden">
        {coverUrl && coverType === "image" && (
          <Image src={coverUrl} fill alt="" className="object-contain" />
        )}
        {coverUrl && coverType === "video" && (
          <video className="object-contain" autoPlay loop muted playsInline>
            <source src={coverUrl} type="video/mp4" />
          </video>
        )}
      </div>
      <div className="flex justify-between font-mono text-xs">
        <p className="group-hover:text-primary flex items-center gap-1 transition">
          {name}{" "}
        </p>
        <p className="text-muted-foreground/50 group-hover:text-primary/50 transition">
          {tags.includes("landing-pages") ||
          tags.includes("dashboard-pages") ? (
            <Badge className="group-hover:text-primary" variant="secondary">
              Landing Page
            </Badge>
          ) : (
            String(index).padStart(3, "0")
          )}
        </p>
      </div>
    </Link>
  );
};

export const ContentPreviewSkeleton = () => {
  return (
    <div className="bg-background group flex flex-col justify-between gap-3 p-3 sm:p-6">
      <div className="aspect-video overflow-hidden">
        <div className="bg-muted h-full w-full animate-pulse rounded" />
      </div>
      <div className="flex justify-between font-mono text-xs">
        <div className="flex items-center gap-1">
          <div className="bg-muted h-4 w-24 animate-pulse rounded" />
        </div>
        <div className="bg-muted h-4 w-8 animate-pulse rounded" />
      </div>
    </div>
  );
};
