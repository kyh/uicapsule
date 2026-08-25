import type { AppRouter } from "./root-router";
import type { InferRouterInputs, InferRouterOutputs } from "@orpc/server";
import { appRouter } from "./root-router";
import { createORPCContext } from "./orpc";

/**
 * Inference helpers for input types
 **/
type RouterInputs = InferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example
 * type MeOutput = RouterOutputs['user']['me']
 **/
type RouterOutputs = InferRouterOutputs<AppRouter>;

export { createORPCContext, appRouter };
export type { AppRouter, RouterInputs, RouterOutputs };
