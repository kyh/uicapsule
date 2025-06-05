import { cn } from "@repo/ui/utils";
import { BookOpen, Globe, Pencil, Shrink } from "lucide-react";

const Page = () => {
  return (
    <>
      <div className="border-border border-b p-8 lg:p-20">
        <h1 className="text-3xl leading-snug! lg:text-4xl xl:text-5xl">
          Welcome to Dieter, where innovation meets craftsmanship in the realm
          of electronic products.
        </h1>
      </div>
      <div className="grid grid-cols-2">
        <GridItem heading="Our Story">
          Dieter was born out of a relentless curiosity and a desire to
          reimagine the way we experience technology. Founded by a group of
          like-minded individuals who believe in the power of imagination, we
          embarked on a journey to blend cutting-edge technology with timeless
          artistry. Our story began in a small workshop where tinkering with
          circuits and assembling component.
        </GridItem>

        <GridItem heading="Craftsmanship">
          At Dieter, we take pride in our commitment to craftsmanship. Every
          product that bears the Dieter name is meticulously handcrafted,
          undergoing rigorous testing to ensure it meets our uncompromising
          standards. We believe that the true beauty of electronics lies not
          only in their performance but also in the artistry behind their
          creation of art.
        </GridItem>

        <GridItem
          heading="Founder's Story"
          icon={<BookOpen width="100%" height="100%" />}
        >
          {`Share a brief story about the founder or founding team's journey, what
          inspired the creation of Dieter, and their personal connection to the
          world.`}
        </GridItem>

        <GridItem
          heading="Mission and Values"
          icon={<Shrink width="100%" height="100%" />}
        >
          {`Outline the mission and core values that drive your company. This can provide visitors with insight into your store's ethos and principles.`}
        </GridItem>

        <GridItem
          heading="Design Process"
          icon={<Pencil width="100%" height="100%" />}
        >
          If relevant, provide a glimpse into the design and creation process of
          your products. Highlight the care and attention that goes into each
          item
        </GridItem>
        <GridItem
          heading="Community Engagement"
          icon={<Globe width="100%" height="100%" />}
        >
          Mention any community initiatives, partnerships, or charity work your
          store is involved in. This shows your commitment to giving back
        </GridItem>
      </div>
    </>
  );
};

export default Page;

type GridItem = {
  heading: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
};

const GridItem = ({ icon, heading, children }: GridItem) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 p-8 lg:p-20",
        !icon && "max-lg:col-span-2",
      )}
    >
      {icon && (
        <div className="flex h-7 w-7 items-center justify-center lg:h-9 lg:w-9">
          {icon}
        </div>
      )}
      <h2
        className={cn(
          "text-xl font-medium lg:text-2xl",
          !icon && "xl:text-3xl",
        )}
      >
        {heading}
      </h2>
      <p className="text-base leading-relaxed! text-[#333] lg:text-lg xl:text-2xl">
        {children}
      </p>
    </div>
  );
};
