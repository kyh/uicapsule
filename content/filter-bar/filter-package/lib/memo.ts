export function memo<const TDeps extends readonly unknown[], TResult>(
  getDeps: () => TDeps,
  compute: (deps: TDeps) => TResult,
): () => TResult {
  let cache: { deps: TDeps; result: TResult } | undefined;

  return () => {
    const deps = getDeps();
    const previous = cache;
    if (
      previous &&
      previous.deps.length === deps.length &&
      deps.every((dep, index) => dep === previous.deps[index])
    ) {
      return previous.result;
    }
    const result = compute(deps);
    cache = { deps, result };
    return result;
  };
}
