import { type } from "@orpc/contract";

import { publicBase } from "../base";
import { componentRequestSchema } from "./request-schema";

/** The filed issue. A filled honeypot answers with the issues page and no `number`. */
type CreatedRequest = { number: number; url: string } | { number?: undefined; url: string };

export const requestContract = {
  create: publicBase.input(componentRequestSchema).output(type<CreatedRequest>()),
};
