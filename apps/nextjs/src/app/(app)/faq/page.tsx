"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@radix-ui/react-accordion";
import { cn } from "@repo/ui/utils";
import { PlusIcon } from "lucide-react";

const Page = () => {
  return (
    <>
      <Accordion type="single" collapsible={true}>
        <FaqItem value="item-1" trigger="How do I place an order?">
          Simply browse our product catalog, choose the item you want, and click
          Add to Cart. Proceed to checkout and follow the prompts to complete
          your purchase.
        </FaqItem>
        <FaqItem value="item-2" trigger="What payment methods do you accept?">
          Simply browse our product catalog, choose the item you want, and click
          Add to Cart. Proceed to checkout and follow the prompts to complete
          your purchase.
        </FaqItem>
        <FaqItem value="item-3" trigger="How long does shipping take?">
          Simply browse our product catalog, choose the item you want, and click
          Add to Cart. Proceed to checkout and follow the prompts to complete
          your purchase.
        </FaqItem>
        <FaqItem value="item-4" trigger="What is your return policy?">
          Simply browse our product catalog, choose the item you want, and click
          Add to Cart. Proceed to checkout and follow the prompts to complete
          your purchase.
        </FaqItem>
        <FaqItem
          value="item-5"
          trigger="How do I get technical support for my product?"
        >
          Simply browse our product catalog, choose the item you want, and click
          Add to Cart. Proceed to checkout and follow the prompts to complete
          your purchase.
        </FaqItem>
        <FaqItem
          value="item-6"
          trigger="Is my payment information safe on your website?"
        >
          Simply browse our product catalog, choose the item you want, and click
          Add to Cart. Proceed to checkout and follow the prompts to complete
          your purchase.
        </FaqItem>
      </Accordion>

      <div className="p-8 xl:p-20">
        <h2 className="text-3xl lg:text-5xl">
          For all of your other inquries you can contact us at{" "}
          <a href="mailto:hi@dieterstore.com" className="underline">
            hi@dieterstore.com
          </a>
        </h2>
      </div>
    </>
  );
};

export default Page;

type FaqItemProps = {
  value: string;
  trigger: string;
  children: React.ReactNode;
};

const FaqItem = ({ value, trigger, children }: FaqItemProps) => {
  return (
    <AccordionItem
      value={value}
      className="border-border relative border-b p-8 xl:p-20"
    >
      <AccordionTrigger className="group flex w-full justify-between pr-20 text-left text-xl leading-tight! lg:text-3xl">
        {trigger}
        <PlusIcon
          width="100%"
          height="100%"
          className={cn(
            "absolute top-1/2 right-8 my-auto h-11 w-11 -translate-y-1/2 transform rounded-full p-1 transition-all duration-500 lg:right-20",
            "group-aria-expanded:bg-primary group-aria-expanded:rotate-[135deg] group-aria-expanded:text-white",
          )}
        />
      </AccordionTrigger>
      <AccordionContent
        className={cn(
          "pr-20 text-base lg:text-2xl",
          "data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp overflow-hidden",
        )}
      >
        <div className="pt-5" />
        {children}
      </AccordionContent>
    </AccordionItem>
  );
};
