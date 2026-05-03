import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

export function Timer() {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div className="flex w-[284px] items-center gap-2 py-3 pr-5 pl-3.5">
      <motion.button
        aria-label="Pause timer"
        onClick={() => setIsPaused((p) => !p)}
        whileTap={{ scale: 0.9 }}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5A3C07] transition-colors hover:bg-[#694608]"
      >
        <AnimatePresence initial={false} mode="wait">
          {isPaused ? (
            <motion.svg
              key="play"
              initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
              transition={{ duration: 0.1 }}
              viewBox="0 0 12 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 fill-current text-[#FDB000]"
            >
              <path d="M0.9375 13.2422C1.25 13.2422 1.51562 13.1172 1.82812 12.9375L10.9375 7.67188C11.5859 7.28906 11.8125 7.03906 11.8125 6.625C11.8125 6.21094 11.5859 5.96094 10.9375 5.58594L1.82812 0.3125C1.51562 0.132812 1.25 0.015625 0.9375 0.015625C0.359375 0.015625 0 0.453125 0 1.13281V12.1172C0 12.7969 0.359375 13.2422 0.9375 13.2422Z" />
            </motion.svg>
          ) : (
            <motion.svg
              key="pause"
              initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
              transition={{ duration: 0.1 }}
              viewBox="0 0 10 13"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 fill-current text-[#FDB000]"
            >
              <path d="M1.03906 12.7266H2.82031C3.5 12.7266 3.85938 12.3672 3.85938 11.6797V1.03906C3.85938 0.328125 3.5 0 2.82031 0H1.03906C0.359375 0 0 0.359375 0 1.03906V11.6797C0 12.3672 0.359375 12.7266 1.03906 12.7266ZM6.71875 12.7266H8.49219C9.17969 12.7266 9.53125 12.3672 9.53125 11.6797V1.03906C9.53125 0.328125 9.17969 0 8.49219 0H6.71875C6.03125 0 5.67188 0.359375 5.67188 1.03906V11.6797C5.67188 12.3672 6.03125 12.7266 6.71875 12.7266Z" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>
      <button
        aria-label="Exit"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3C3D3C] text-white transition-colors hover:bg-[#4A4B4A]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="ml-auto flex items-baseline gap-1.5 pr-0.5 text-[#F7A815]">
        <span className="text-sm leading-none font-medium text-inherit">Timer</span>
        <Counter paused={isPaused} />
      </div>
    </div>
  );
}

function Counter({ paused }: { paused?: boolean }) {
  const [count, setCount] = useState(60);

  useEffect(() => {
    if (paused) return;

    const id = setInterval(() => {
      setCount((c) => {
        if (c === 0) {
          return 60;
        }
        return c - 1;
      });
    }, 1000);

    return () => {
      clearInterval(id);
    };
  }, [paused]);

  const countArray = count.toString().padStart(2, "0").split("");

  return (
    <div className="relative w-[64px] overflow-hidden text-3xl font-light whitespace-nowrap">
      0:
      <AnimatePresence initial={false} mode="popLayout">
        {countArray.map((n, i) => (
          <motion.div
            className="inline-block tabular-nums"
            key={n + i}
            initial={{ y: "12px", filter: "blur(2px)", opacity: 0 }}
            animate={{ y: "0", filter: "blur(0px)", opacity: 1 }}
            exit={{ y: "-12px", filter: "blur(2px)", opacity: 0 }}
            transition={{ type: "spring", bounce: 0.35 }}
          >
            {n}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
