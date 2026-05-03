import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Ring() {
  const [isSilent, setIsSilent] = useState(false);
  const [firstTime, setFirstTime] = useState(true);

  useEffect(() => {
    const id = setTimeout(
      () => {
        setFirstTime(false);
        setIsSilent((s) => !s);
      },
      firstTime ? 1000 : 2000,
    );

    return () => clearTimeout(id);
  }, [isSilent, firstTime]);

  return (
    <motion.div
      initial={false}
      className="relative flex h-7 items-center justify-between px-2.5"
      animate={{ width: isSilent ? 148 : 128 }}
      transition={{ type: "spring", bounce: 0.5 }}
    >
      <AnimatePresence>
        {isSilent ? (
          <motion.div
            initial={{ width: 0, opacity: 0, filter: "blur(4px)" }}
            animate={{
              width: 40,
              opacity: 1,
              filter: "blur(0px)",
            }}
            exit={{ width: 0, opacity: 0, filter: "blur(4px)" }}
            transition={{ type: "spring", bounce: 0.35 }}
            className="absolute left-[5px] h-[18px] w-10 rounded-full bg-[#FD4F30]"
          />
        ) : null}
      </AnimatePresence>
      <motion.div
        initial={false}
        className="relative h-[12.75px] w-[11.25px]"
        animate={{
          rotate: isSilent ? [0, -15, 5, -2, 0] : [0, 20, -15, 12.5, -10, 10, -7.5, 7.5, -5, 5, 0],
          x: isSilent ? 9 : 0,
        }}
      >
        <svg
          className="inset-0"
          width="11.25"
          height="12.75"
          viewBox="0 0 15 17"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1.17969 13.3125H13.5625C14.2969 13.3125 14.7422 12.9375 14.7422 12.3672C14.7422 11.5859 13.9453 10.8828 13.2734 10.1875C12.7578 9.64844 12.6172 8.53906 12.5547 7.64062C12.5 4.64062 11.7031 2.57812 9.625 1.82812C9.32812 0.804688 8.52344 0 7.36719 0C6.21875 0 5.40625 0.804688 5.11719 1.82812C3.03906 2.57812 2.24219 4.64062 2.1875 7.64062C2.125 8.53906 1.98438 9.64844 1.46875 10.1875C0.789062 10.8828 0 11.5859 0 12.3672C0 12.9375 0.4375 13.3125 1.17969 13.3125ZM7.36719 16.4453C8.69531 16.4453 9.66406 15.4766 9.76562 14.3828H4.97656C5.07812 15.4766 6.04688 16.4453 7.36719 16.4453Z"
            fill="white"
          />
        </svg>
        <div className="absolute inset-0">
          <div className="h-5 translate-x-[5.25px] -translate-y-[5px] rotate-[-40deg] overflow-hidden">
            <motion.div
              animate={{ height: isSilent ? 16 : 0 }}
              transition={{
                ease: "easeInOut",
                duration: isSilent ? 0.125 : 0.05,
                delay: isSilent ? 0.15 : 0,
              }}
              className="w-fit rounded-full"
            >
              <div className="flex h-full w-[3px] items-center justify-center rounded-full bg-[#FD4F30]">
                <div className="h-full w-[0.75px] rounded-full bg-white" />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
      <div className="ml-auto flex items-center">
        {isSilent ? (
          <span className="text-xs font-medium text-[#FD4F30]">Silent</span>
        ) : (
          <span className="text-xs font-medium text-white">Ring</span>
        )}
      </div>
    </motion.div>
  );
}
