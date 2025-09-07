import Image from "next/image";
import Link from "next/link";

export type ContentPreviewProps = {
  slug: string;
  name: string;
  index: number;
  coverUrl?: string;
  coverType?: "image" | "video";
};

export const ContentPreview = ({
  slug,
  name,
  index,
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
        <p className="group-hover:text-primary transition">{name}</p>
        <p className="text-muted-foreground/50 group-hover:text-primary/50 transition">
          {String(index).padStart(3, "0")}
        </p>
      </div>
    </Link>
  );
};
