import { SlidersHorizontalIcon } from "lucide-react";

export const PropsPanel = () => (
  <div className="flex h-full flex-col">
    <header className="border-b px-4 py-4">
      <h2 className="text-lg font-medium">Props</h2>
    </header>
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <SlidersHorizontalIcon aria-hidden className="text-muted-foreground size-5" />
      <p className="text-muted-foreground max-w-56 text-sm text-pretty">
        This component doesn’t expose any props yet.
      </p>
    </div>
  </div>
);
