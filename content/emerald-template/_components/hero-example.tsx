"use client";

import { createElement, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { Badge } from "./ui";
import { cn } from "cn";
import {
  BarChart3,
  BookOpen,
  CheckCircle,
  FileText,
  GitBranch,
  Search,
  Shield,
  Users,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "motion/react";

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "./chain-of-thought";

const samples = [
  {
    input: "Can you provide a changelog of everything shipped in Dataembed this week?",
    output: {
      reasoning: [
        {
          icon: Search,
          text: "Searching through Asana tickets for this week...",
        },
        {
          icon: GitBranch,
          text: "Checking GitHub commits and pull requests...",
        },
        {
          icon: BarChart3,
          text: "Analyzing version releases and deployments...",
        },
        { icon: FileText, text: "Compiling changelog information..." },
      ],
      references: [
        { content: "Ticket #1704", source: "asana" },
        { content: "PR #102", source: "github" },
      ],
      text: `
According to Asana and Github commits, the following things were completed this week:

Version 1.1.2 launch - 3/14/2025:
- Added a new feature for sentiment analysis, allowing users to analyze the sentiment of text inputs
- Improved the accuracy of the image recognition module by integrating the Azure deep learning model
- Fixed a bug that caused the application to crash when processing large datasets
- Optimized the performance of the recommendation engine
      `.trim(),
    },
  },
  {
    input: "Who is responsible for the new landing experience?",
    output: {
      reasoning: [
        {
          icon: Users,
          text: "Looking up project ownership in team directory...",
        },
        { icon: BookOpen, text: "Checking project documentation and specs..." },
        {
          icon: Search,
          text: "Finding team lead and stakeholder information...",
        },
        { icon: FileText, text: "Gathering project context and background..." },
      ],
      references: [
        { content: "Grow Team", source: "site" },
        { content: "Project Neue", source: "notion" },
        { content: "Kevin Wu (Grow)", source: "person" },
      ],
      text: `
The team responsible for "Project Neue", the new landing page, is the Grow team. It is an initiative launched by Kevin Wu to showcase our free training and resources programs, to help people acquire the digital skills they need to succeed in the modern economy.

The initiative aims to bridge the digital skills gap and provide opportunities for individuals and businesses to learn and grow.

The Grow team collaborates with various partners, including educational institutions, nonprofits, and local communities, to deliver in-person workshops, online training courses, and other resources. 
      `.trim(),
    },
  },
  {
    input: "Whats our HR policy on working from home?",
    output: {
      reasoning: [
        { icon: Search, text: "Searching HR policy documents..." },
        {
          icon: BookOpen,
          text: "Checking employee handbook for remote work...",
        },
        { icon: Shield, text: "Looking up recent policy updates..." },
        { icon: CheckCircle, text: "Verifying current guidelines..." },
      ],
      references: [
        { content: "Onboarding 101", source: "ppt" },
        { content: "Patty (HR)", source: "person" },
      ],
      text: "According to the latest onboarding docs, we have a flexible work policy. You can work from home as long as you get your work done and are available for meetings.",
    },
  },
];

const wait = (delay: number) => {
  let timeout: ReturnType<typeof setTimeout>;

  // oxlint-disable-next-line promise/avoid-new -- a cancellable sleep in the browser; there is no promise-returning timer to await here
  const promise = new Promise((resolve) => {
    timeout = setTimeout(resolve, delay);
  });

  return {
    cancel: () => clearTimeout(timeout),
    promise,
  };
};

type StepIcon = ComponentType<{ size?: number }>;

type StepStatus = "complete" | "active" | "pending";

const stepStatus = (stepIndex: number, currentStepIndex: number): StepStatus => {
  if (stepIndex < currentStepIndex) {
    return "complete";
  }
  if (stepIndex === currentStepIndex) {
    return "active";
  }
  return "pending";
};

const Spinner = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    {...props}
  >
    <path d="M2,12A10.94,10.94,0,0,1,5,4.65c-.21-.19-.42-.36-.62-.55h0A11,11,0,0,0,12,23c.34,0,.67,0,1-.05C6,23,2,17.74,2,12Z">
      <animateTransform
        attributeName="transform"
        type="rotate"
        dur="0.6s"
        values="0 12 12;360 12 12"
        repeatCount="indefinite"
      />
    </path>
  </svg>
);

// Keyed elements returned directly under AnimatePresence, so the swap between
// spinner and icon still animates out and in.
const statusIcon = (status: StepStatus, staticIcon: StepIcon) => {
  if (status === "active") {
    return (
      <motion.div
        key="spinner"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{
          duration: 0.2,
          ease: "easeOut",
        }}
      >
        <Spinner />
      </motion.div>
    );
  }
  if (status === "complete") {
    return (
      <motion.div
        key="icon"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.3,
          ease: "easeOut",
        }}
      >
        {createElement(staticIcon, { size: 16 })}
      </motion.div>
    );
  }
  return (
    <motion.div
      key="pending"
      initial={{ opacity: 0.3, scale: 1 }}
      animate={{ opacity: 0.3, scale: 1 }}
    >
      {createElement(staticIcon, { size: 16 })}
    </motion.div>
  );
};

const AnimatedIconBase = ({
  stepIndex,
  staticIcon,
  currentStepIndex,
}: {
  stepIndex: number;
  staticIcon: StepIcon;
  currentStepIndex: number;
}) => (
  <AnimatePresence mode="wait">
    {statusIcon(stepStatus(stepIndex, currentStepIndex), staticIcon)}
  </AnimatePresence>
);

const AnimatedIcon = memo(AnimatedIconBase);

const MemoizedChainOfThoughtStepBase = ({
  stepIndex,
  staticIcon,
  label,
  currentStepIndex,
}: {
  stepIndex: number;
  staticIcon: StepIcon;
  label: string;
  currentStepIndex: number;
}) => {
  const status = stepStatus(stepIndex, currentStepIndex);

  return (
    <ChainOfThoughtStep
      icon={
        <AnimatedIcon
          stepIndex={stepIndex}
          staticIcon={staticIcon}
          currentStepIndex={currentStepIndex}
        />
      }
      label={label}
      status={status}
    />
  );
};

const MemoizedChainOfThoughtStep = memo(MemoizedChainOfThoughtStepBase);

const Typewriter = ({
  start,
  text,
  onTyped,
  splitType = "letters",
  hideCursor,
}: {
  start: boolean;
  text: string;
  onTyped?: () => void;
  splitType?: "letters" | "words";
  hideCursor?: boolean;
}) => {
  const textContainerRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    let i = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    const splitBy = splitType === "letters" ? "" : " ";
    const splitText = text.split(splitBy);

    const write = () => {
      if (cancelled || !textContainerRef.current || finishedRef.current) {
        return;
      }
      if (i < splitText.length) {
        textContainerRef.current.textContent = splitText.slice(0, i + 1).join(splitBy);
        i += 1;
        timeoutId = setTimeout(write, 25);
      } else {
        finishedRef.current = true;
        i = 0;
        onTyped?.();
      }
    };

    const clear = () => {
      if (cancelled || !textContainerRef.current || !finishedRef.current) {
        return;
      }
      if (i < splitText.length) {
        textContainerRef.current.textContent = splitText.slice(0, text.length - i).join(splitBy);
        i += 1;
        timeoutId = setTimeout(clear, 5);
      } else {
        finishedRef.current = false;
        i = 0;
        textContainerRef.current.textContent = "";
      }
    };

    if (start) {
      write();
    } else {
      clear();
    }

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [start, text, onTyped, splitType]);

  return (
    <div>
      <span ref={textContainerRef} />
      {!hideCursor && <span className="cursor">|</span>}
    </div>
  );
};

export const ExampleChat = ({ start }: { start: boolean }) => {
  const promisesRef = useRef<(() => void)[]>([]);
  const [currentSampleIndex, setCurrentSampleIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(true);
  const [showLoading, setShowLoading] = useState(false);
  const [showChainOfThought, setShowChainOfThought] = useState(false);
  const [chainOfThoughtOpen, setChainOfThoughtOpen] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [thinkingDuration, setThinkingDuration] = useState<number | null>(null);
  const [isThinkingComplete, setIsThinkingComplete] = useState(false);

  const clearAll = useCallback(() => {
    setShowQuestion(false);
    setShowLoading(false);
    setShowChainOfThought(false);
    setChainOfThoughtOpen(true);
    setShowAnswer(false);
    setShowFooter(false);
    setThinkingDuration(null);
    setIsThinkingComplete(false);
  }, []);

  const [previousStart, setPreviousStart] = useState(start);
  if (previousStart !== start) {
    setPreviousStart(start);
    clearAll();
    setShowQuestion(start);
  }

  useEffect(() => {
    if (!start) {
      return;
    }
    const pending = promisesRef.current;
    return () => {
      for (const cancel of pending) {
        cancel();
      }
      pending.length = 0;
    };
  }, [start]);

  const showResults = async () => {
    setShowLoading(true);
    const afterShowLoading = wait(1000);
    promisesRef.current.push(afterShowLoading.cancel);
    await afterShowLoading.promise;

    const startTime = Date.now();
    setShowChainOfThought(true);
    setChainOfThoughtOpen(true);
    setCurrentStepIndex(-1);
    setIsThinkingComplete(false);

    const reasoningStepCount = samples[currentSampleIndex]?.output.reasoning.length ?? 0;
    for (let i = 0; i < reasoningStepCount; i += 1) {
      setCurrentStepIndex(i);
      const stepDelay = wait(800);
      promisesRef.current.push(stepDelay.cancel);
      await stepDelay.promise;
    }

    const afterAllSteps = wait(500);
    promisesRef.current.push(afterAllSteps.cancel);
    await afterAllSteps.promise;

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    setThinkingDuration(duration);
    setIsThinkingComplete(true);

    setChainOfThoughtOpen(false);
    const afterCollapse = wait(300);
    promisesRef.current.push(afterCollapse.cancel);
    await afterCollapse.promise;

    setShowAnswer(true);
    const afterShowAnswer = wait(1000);
    promisesRef.current.push(afterShowAnswer.cancel);
    await afterShowAnswer.promise;

    setShowFooter(true);
    const afterShowFooter = wait(5000);
    promisesRef.current.push(afterShowFooter.cancel);
    await afterShowFooter.promise;

    clearAll();
    const afterClearAll = wait(1000);
    promisesRef.current.push(afterClearAll.cancel);
    await afterClearAll.promise;

    setCurrentSampleIndex((currentSampleIndex + 1) % samples.length);
    setShowQuestion(true);
  };

  const currentSample = samples[currentSampleIndex];

  const chainOfThoughtHeaderText = useMemo(() => {
    if (isThinkingComplete && thinkingDuration !== null) {
      return `Thought for ${thinkingDuration} second${thinkingDuration === 1 ? "" : "s"}`;
    }
    return "Thinking...";
  }, [isThinkingComplete, thinkingDuration]);

  const reasoningSteps = useMemo(
    () =>
      currentSample?.output.reasoning.map((step, index) => (
        <MemoizedChainOfThoughtStep
          key={step.text}
          stepIndex={index}
          staticIcon={step.icon}
          label={step.text}
          currentStepIndex={currentStepIndex}
        />
      )),
    [currentSample?.output.reasoning, currentStepIndex],
  );

  return (
    <section className="container shadow-2xl shadow-emerald-900/50">
      <section className="window">
        <div className="input">
          <Typewriter
            start={start && showQuestion}
            text={currentSample?.input ?? ""}
            onTyped={() => showResults()}
          />
        </div>
        <div className={cn("loading", showLoading && "active")} />
        <div className="output">
          <AnimatePresence>
            {start && showChainOfThought && (
              <motion.div
                className="chainOfThought"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <ChainOfThought open={chainOfThoughtOpen} onOpenChange={setChainOfThoughtOpen}>
                  <ChainOfThoughtHeader>{chainOfThoughtHeaderText}</ChainOfThoughtHeader>
                  <ChainOfThoughtContent>{reasoningSteps}</ChainOfThoughtContent>
                </ChainOfThought>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {start && showAnswer && (
              <motion.div
                className="outputText"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <Typewriter
                  start
                  text={currentSample?.output.text ?? ""}
                  splitType="words"
                  hideCursor
                />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {start && showFooter && (
              <motion.footer
                className="outputFooter"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ul className="flex gap-2">
                  {currentSample?.output.references.map((reference) => (
                    <Badge key={reference.content}>{reference.content}</Badge>
                  ))}
                </ul>
              </motion.footer>
            )}
          </AnimatePresence>
        </div>
      </section>
    </section>
  );
};

const scrollYProgressMap = [0, 0.1];

export const HeroExample = () => {
  const [isScaled, setIsScaled] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, {
    amount: 1,
  });
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, scrollYProgressMap, [21.28, 0]);
  const z = useTransform(scrollYProgress, scrollYProgressMap, [-74.56, 0]);
  const rotateX = useTransform(scrollYProgress, scrollYProgressMap, [40, 0]);
  const scale = useTransform(scrollYProgress, scrollYProgressMap, [0.9, 1]);

  useMotionValueEvent(scale, "change", (latest) => {
    if (latest > 0.97) {
      setIsScaled(true);
    } else {
      setIsScaled(false);
    }
  });

  const shouldRun = isScaled && isInView;

  return (
    <>
      <AnimatePresence>
        {shouldRun && (
          <motion.div
            className="pointer-events-none fixed inset-0 bg-transparent backdrop-blur transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
      <motion.div
        ref={ref}
        className="mx-auto mt-10 max-w-[900px] px-3 shadow"
        style={{
          rotateX,
          scale,
          transformPerspective: 3312,
          y,
          z,
        }}
      >
        <ExampleChat start={shouldRun} />
      </motion.div>
    </>
  );
};
