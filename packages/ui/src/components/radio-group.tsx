"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { cn } from "cn";

import { checkControlClassname, checkIndicatorClassname } from "./checkbox";

const RadioGroup = <Value,>({ className, ...props }: RadioGroupPrimitive.Props<Value>) => (
  <RadioGroupPrimitive data-slot="radio-group" className={cn("grid", className)} {...props} />
);

const RadioGroupItem = ({ className, ...props }: RadioPrimitive.Root.Props) => (
  <RadioPrimitive.Root
    data-slot="radio-group-item"
    className={cn(checkControlClassname, "data-checked:border-primary rounded-full", className)}
    {...props}
  >
    <RadioPrimitive.Indicator
      data-slot="radio-group-indicator"
      keepMounted
      className={checkIndicatorClassname}
    >
      <span className="bg-primary size-[7px] scale-0 rounded-full transition-transform duration-150 ease-out group-data-checked/check:scale-100" />
    </RadioPrimitive.Indicator>
  </RadioPrimitive.Root>
);

export { RadioGroup, RadioGroupItem };
