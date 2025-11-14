import React from "react";
import { cx, CxOptions } from "class-variance-authority";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  FilePlus2,
  GalleryVerticalEnd,
  Headphones,
  MessagesSquare,
  Search,
  Settings,
  Star,
  User,
  UserRoundPlus,
  X,
} from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { twMerge } from "tailwind-merge";

interface HeaderMenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const HeaderMenu = ({ isOpen, setIsOpen }: HeaderMenuProps) => {
  return (
    <MotionConfig transition={{ duration: 0.5, type: "spring", bounce: 0 }}>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-black/50"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOpen && (
          <div className="absolute top-3 left-0 z-[61] flex w-full justify-center">
            <motion.div
              layoutId="wrapper"
              className="relative h-full w-[97%] overflow-hidden bg-[#1B1D20]"
              style={{ borderRadius: 20 }}
            >
              <header className="flex h-12 items-center gap-1 px-2">
                <div className="relative isolate h-8 w-8">
                  <motion.div
                    layoutId="wrapper-avatar"
                    animate={{ scale: 0, opacity: 0 }}
                    className="relative isolate h-8 w-8"
                  >
                    <img
                      src="https://pbs.twimg.com/profile_images/1760212439944278016/6cTEMery_400x400.jpg"
                      alt="logo"
                      className="rounded-lg"
                    />
                  </motion.div>
                  <motion.button
                    layoutId="wrapper-close-button"
                    className="absolute top-0 left-0 -z-10 flex h-8 w-8 items-center justify-center text-[#C7C9CD]"
                    onClick={() => setIsOpen(false)}
                  >
                    <X strokeWidth={1.5} size={20} />
                  </motion.button>
                </div>
                <motion.div
                  layoutId="wrapper-user-info"
                  className="-space-y-px"
                >
                  <h2 className="text-left text-sm font-bold">Kai</h2>
                  <p className="flex items-center text-xs text-[#ABABB0]">
                    3 tabs
                  </p>
                </motion.div>
                <button className="ml-auto flex h-8 w-8 items-center justify-center">
                  <Ellipsis strokeWidth={1.5} size={20} />
                </button>
              </header>
              <WrapperMenu />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <header className="sticky top-0 z-50 flex h-12 items-center gap-1 border-b border-b-[#27292E] bg-[#1C1D22] px-2">
        <motion.button
          layoutId="wrapper"
          className="relative grow overflow-hidden bg-[#232429] p-0.5"
          style={{ borderRadius: 8 }}
          onClick={() => setIsOpen(true)}
        >
          <div className="flex items-center gap-2">
            <div className="relative isolate h-8 w-8">
              <motion.div
                layoutId="wrapper-avatar"
                className="relative isolate h-8 w-8"
              >
                <img
                  src="https://pbs.twimg.com/profile_images/1760212439944278016/6cTEMery_400x400.jpg"
                  alt="logo"
                  className="rounded-lg"
                />
              </motion.div>
              <motion.button
                layoutId="wrapper-close-button"
                className="absolute top-0 left-0 -z-10 flex h-8 w-8 items-center justify-center"
                onClick={() => setIsOpen(false)}
              >
                <X strokeWidth={1.5} />
              </motion.button>
            </div>
            <motion.div layoutId="wrapper-user-info" className="-space-y-0.5">
              <h2 className="text-left text-sm font-bold">Kai</h2>
              <p className="flex items-center text-xs text-[#ABABB0]">
                3 tabs
                <ChevronDown strokeWidth={1.5} size={16} />
              </p>
            </motion.div>
          </div>
          <WrapperMenu className="pointer-events-none absolute top-0 right-0 left-0 opacity-0" />
        </motion.button>
        <button className="flex h-8 w-8 items-center justify-center">
          <Headphones strokeWidth={1.7} size={20} />
        </button>
      </header>
    </MotionConfig>
  );
};

const WrapperMenu = ({ className }: { className?: string }) => {
  return (
    <AnimatePresence>
      <motion.div
        layoutId="wrapper-menu"
        className={cn("mt-1 text-[#C7C9CD]", className)}
      >
        <motion.div
          layout
          className="mb-2 grid grid-cols-3 gap-2 px-3 text-white"
        >
          <button className="flex h-9 items-center justify-center gap-1 rounded-lg border border-[#313538] px-1 text-sm">
            <UserRoundPlus strokeWidth={1.5} size={16} />
            Add
          </button>
          <button className="flex h-9 items-center justify-center gap-1 rounded-lg border border-[#313538] px-1 text-sm">
            <Star strokeWidth={1.5} size={16} />
            Move
          </button>
          <button className="flex h-9 items-center justify-center gap-1 rounded-lg border border-[#313538] px-1 text-sm">
            <Search strokeWidth={1.5} size={16} />
            Search
          </button>
        </motion.div>
        <motion.div layout className="flex flex-col px-1">
          <button className="flex h-8 items-center gap-1 rounded-lg px-1 text-start text-sm hover:bg-[#313538]">
            <div className="flex h-8 w-8 items-center justify-center">
              <MessagesSquare strokeWidth={1.5} size={16} />
            </div>
            Messages
          </button>
          <button className="flex h-8 items-center gap-1 rounded-lg px-1 text-start text-sm hover:bg-[#313538]">
            <div className="flex h-8 w-8 items-center justify-center">
              <FilePlus2 strokeWidth={1.5} size={16} />
            </div>
            Add canvas
          </button>
          <button className="flex h-8 items-center gap-1 rounded-lg px-1 text-start text-sm hover:bg-[#313538]">
            <div className="flex h-8 w-8 items-center justify-center">
              <GalleryVerticalEnd strokeWidth={1.5} size={16} />
            </div>
            Files
          </button>
        </motion.div>
        <div className="flex h-4 items-center justify-center">
          <div className="h-px w-full bg-[#23272A]" />
        </div>
        <motion.div layout className="flex flex-col px-1">
          <button className="flex h-8 items-center gap-1 rounded-lg px-1 text-start text-sm hover:bg-[#313538]">
            <div className="flex h-8 w-8 items-center justify-center">
              <User strokeWidth={1.5} size={16} />
            </div>
            <span className="inline-block grow">View Profile</span>
            <ChevronRight strokeWidth={1.5} size={16} />
          </button>
          <button className="flex h-8 items-center gap-1 rounded-lg px-1 text-start text-sm hover:bg-[#313538]">
            <div className="flex h-8 w-8 items-center justify-center">
              <Settings strokeWidth={1.5} size={16} />
            </div>
            <span className="inline-block grow">View Profile</span>
            <ChevronRight strokeWidth={1.5} size={16} />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const cn = (...inputs: CxOptions) => twMerge(cx(inputs));
