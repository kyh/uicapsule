import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type ComponentItemProps = {
  slug: string;
  name: string;
  coverUrl?: string;
  coverType?: "image" | "video";
};

export const ComponentItem = ({
  slug,
  name,
  coverUrl,
  coverType,
}: ComponentItemProps) => {
  return (
    <Link
      className="group bg-background flex flex-col justify-between p-6 text-lg"
      href={`/ui/${slug}`}
    >
      <div className="p-5">
        {coverUrl && coverType === "image" && (
          <Image src={coverUrl} fill alt="" className="object-contain" />
        )}
        {coverUrl && coverType === "video" && (
          <video className="object-contain" autoPlay loop muted playsInline>
            <source src={coverUrl} type="video/mp4" />
          </video>
        )}
      </div>
      <div className="flex justify-between">
        <p className="group-hover:underline">{name}</p>
        <ArrowRight size={24} />
      </div>
    </Link>
  );
};
