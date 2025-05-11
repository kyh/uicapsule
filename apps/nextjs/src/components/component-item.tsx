import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type ComponentItemProps = {
  slug: string;
  name: string;
};

export const ComponentItem = ({ slug, name }: ComponentItemProps) => {
  return (
    <Link
      className="group bg-background flex flex-col justify-between p-6 text-lg"
      href={`/ui/${slug}`}
    >
      <div className="relative aspect-square h-1/2 w-full overflow-hidden">
        {/* <Image src={image} fill alt="" className="object-contain" /> */}
      </div>
      <div className="flex justify-between">
        <p className="group-hover:underline">{name}</p>
        <ArrowRight size={24} />
      </div>
    </Link>
  );
};
