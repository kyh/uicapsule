export const ContentRendererSkeleton = () => {
  return (
    <div className="flex h-full w-full flex-col gap-2 pb-2">
      <div className="bg-muted mx-auto h-full w-full max-w-[720px] animate-pulse rounded-md" />
      <div className="bg-muted mx-auto hidden h-9 w-18.5 animate-pulse rounded-lg md:flex" />
    </div>
  );
};
