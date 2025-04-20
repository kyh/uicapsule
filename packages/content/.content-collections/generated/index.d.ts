import configuration from "../../content-collections.ts";
import { GetTypeByName } from "@content-collections/core";

export type ComponentsMeta = GetTypeByName<typeof configuration, "componentsMeta">;
export declare const allComponentsMetas: Array<ComponentsMeta>;

export {};
