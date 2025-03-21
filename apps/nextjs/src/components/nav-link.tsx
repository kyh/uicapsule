import Link from "next/link";
import cn from "clsx";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
  setIsOpen: (isOpen: boolean) => void;
  isActive: boolean;
};

export const NavLink = ({
  href,
  children,
  setIsOpen,
  isActive,
}: NavLinkProps) => {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-2 px-9 py-6 text-lg leading-none hover:text-black md:justify-center",
        "max-md:text-3xl",
        isActive ? "text-black" : "text-[#6b6b6b]",
      )}
      onClick={() => setIsOpen(false)}
    >
      <div
        className={cn(
          "aspect-square h-1 rotate-45 bg-black max-md:hidden",
          isActive ? "block" : "hidden",
        )}
      />
      <div
        className={cn(
          "absolute bottom-0 h-1 w-full duration-200 ease-in group-hover:bg-gray-200 max-md:hidden",
          isActive && "bg-black group-hover:bg-black!",
        )}
      />
      {children}
    </Link>
  );
};
