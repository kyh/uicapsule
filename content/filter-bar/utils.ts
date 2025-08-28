import { cx, CxOptions } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: CxOptions) => twMerge(cx(inputs));
