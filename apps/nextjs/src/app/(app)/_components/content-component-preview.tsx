import Image from "next/image";
import Link from "next/link";

export type ContentComponentPreviewProps = {
  slug: string;
  name: string;
  index: number;
  coverUrl?: string;
  coverType?: "image" | "video";
};

export const ContentComponentPreview = ({
  slug,
  name,
  index,
  coverUrl,
  coverType,
}: ContentComponentPreviewProps) => {
  return (
    <Link
      className="bg-background flex flex-col justify-between gap-3 p-3 text-lg transition group-hover:opacity-80 hover:opacity-100 sm:p-6"
      href={`/ui/${slug}`}
    >
      <div>
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
        <p>{name}</p>
        <p className="text-muted-foreground">
          {String(index).padStart(3, "0")}
        </p>
      </div>
    </Link>
  );
};
