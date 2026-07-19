import { type ComponentType, type SVGProps } from "react";
import { cn } from "@repo/ui/lib/utils";

const ICON_ASSET_BASE =
  "https://zmdrwswxugswzmcokvff.supabase.co/storage/v1/object/public/uicapsule/emerald-template";

const shellClassName =
  "inline-flex justify-center rounded-full border border-dashed border-zinc-700 bg-zinc-900 p-3 text-white";

/** An icon rendered from a component (lucide / simple-icons). */
export const SourceIcon = ({
  Icon,
  className,
}: {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  className?: string;
}) => (
  <div className={cn(shellClassName, className)}>
    <Icon className="size-5" />
  </div>
);

/** An icon rendered from a remotely hosted brand SVG, addressed by id. */
export const SourceAssetIcon = ({ id, className }: { id: string; className?: string }) => (
  <div className={cn(shellClassName, className)}>
    <img alt={id} width={20} height={20} className="size-5" src={`${ICON_ASSET_BASE}/${id}.svg`} />
  </div>
);
