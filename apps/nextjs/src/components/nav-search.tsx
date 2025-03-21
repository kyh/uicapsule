import cn from "clsx";
import { SearchIcon } from "lucide-react";

type Button = {
  text: string;
};

const categories = [
  "All",
  "Calculator",
  "Clock",
  "Gaming",
  "Radio",
  "Recorder",
  "Speaker",
];

const NavButton = ({ text }: Button) => {
  return (
    <button
      className={cn(
        "border-border rounded-full border px-7 py-3 text-lg leading-none",
        text == "All" && "border-primary bg-primary text-white",
      )}
    >
      {text}
    </button>
  );
};

export const NavSearch = () => {
  return (
    <div className="border-color flex h-20 items-center justify-between border-b">
      <div className="flex h-20 flex-1 items-center gap-3 overflow-y-hidden pl-6">
        {categories.map((category, key) => (
          <NavButton text={category} key={key} />
        ))}
      </div>
      <button className="border-border flex h-full w-20 items-center justify-center border-l">
        <SearchIcon />
      </button>
    </div>
  );
};
