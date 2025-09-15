"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@repo/ui/badge";
import { cn } from "@repo/ui/utils";
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
          transformPerspective: 3312,
          y,
          z,
          rotateX,
          scale,
        }}
      >
        <ExampleChat start={shouldRun} />
      </motion.div>
    </>
  );
};

const samples = [
  {
    input:
      "Can you provide a changelog of everything shipped in Dataembed this week?",
    output: {
      reasoning: [
        {
          text: "Searching through Asana tickets for this week...",
          icon: Search,
        },
        {
          text: "Checking GitHub commits and pull requests...",
          icon: GitBranch,
        },
        {
          text: "Analyzing version releases and deployments...",
          icon: BarChart3,
        },
        { text: "Compiling changelog information...", icon: FileText },
      ],
      text: `
According to Asana and Github commits, the following things were completed this week:

Version 1.1.2 launch - ${new Date().toLocaleDateString()}:
- Added a new feature for sentiment analysis, allowing users to analyze the sentiment of text inputs
- Improved the accuracy of the image recognition module by integrating the Azure deep learning model
- Fixed a bug that caused the application to crash when processing large datasets
- Optimized the performance of the recommendation engine
      `.trim(),
      references: [
        { source: "asana", content: "Ticket #1704" },
        { source: "github", content: "PR #102" },
      ],
    },
  },
  {
    input: "Who is responsible for the new landing experience?",
    output: {
      reasoning: [
        {
          text: "Looking up project ownership in team directory...",
          icon: Users,
        },
        { text: "Checking project documentation and specs...", icon: BookOpen },
        {
          text: "Finding team lead and stakeholder information...",
          icon: Search,
        },
        { text: "Gathering project context and background...", icon: FileText },
      ],
      text: `
The team responsible for "Project Neue", the new landing page, is the Grow team. It is an initiative launched by Kevin Wu to showcase our free training and resources programs, to help people acquire the digital skills they need to succeed in the modern economy.

The initiative aims to bridge the digital skills gap and provide opportunities for individuals and businesses to learn and grow.

The Grow team collaborates with various partners, including educational institutions, nonprofits, and local communities, to deliver in-person workshops, online training courses, and other resources. 
      `.trim(),
      references: [
        { source: "site", content: "Grow Team" },
        { source: "notion", content: "Project Neue" },
        { source: "person", content: "Kevin Wu (Grow)" },
      ],
    },
  },
  {
    input: "Whats our HR policy on working from home?",
    output: {
      reasoning: [
        { text: "Searching HR policy documents...", icon: Search },
        {
          text: "Checking employee handbook for remote work...",
          icon: BookOpen,
        },
        { text: "Looking up recent policy updates...", icon: Shield },
        { text: "Verifying current guidelines...", icon: CheckCircle },
      ],
      text: "According to the latest onboarding docs, we have a flexible work policy. You can work from home as long as you get your work done and are available for meetings.",
      references: [
        { source: "ppt", content: "Onboarding 101" },
        { source: "person", content: "Patty (HR)" },
      ],
    },
  },
];

const wait = (delay: number) => {
  let timeout: ReturnType<typeof setTimeout>;

  const promise = new Promise((resolve) => {
    timeout = setTimeout(resolve, delay);
  });

  return {
    promise,
    cancel: () => clearTimeout(timeout),
  };
};

const AnimatedIcon = React.memo(
  ({
    stepIndex,
    staticIcon,
    currentStepIndex,
  }: {
    stepIndex: number;
    staticIcon: any;
    currentStepIndex: number;
  }) => {
    const status =
      stepIndex < currentStepIndex
        ? "complete"
        : stepIndex === currentStepIndex
          ? "active"
          : "pending";

    return (
      <AnimatePresence mode="wait">
        {status === "active" ? (
          <motion.div
            key="spinner"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
          >
            <Spinner />
          </motion.div>
        ) : status === "complete" && staticIcon ? (
          <motion.div
            key="icon"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
          >
            {React.createElement(staticIcon, { size: 16 })}
          </motion.div>
        ) : (
          <motion.div
            key="pending"
            initial={{ scale: 1, opacity: 0.3 }}
            animate={{ scale: 1, opacity: 0.3 }}
          >
            {staticIcon && React.createElement(staticIcon, { size: 16 })}
          </motion.div>
        )}
      </AnimatePresence>
    );
  },
);

const MemoizedChainOfThoughtStep = React.memo(
  ({
    stepIndex,
    staticIcon,
    label,
    currentStepIndex,
  }: {
    stepIndex: number;
    staticIcon: any;
    label: string;
    currentStepIndex: number;
  }) => {
    const status =
      stepIndex < currentStepIndex
        ? "complete"
        : stepIndex === currentStepIndex
          ? "active"
          : "pending";

    return (
      <ChainOfThoughtStep
        icon={() => (
          <AnimatedIcon
            stepIndex={stepIndex}
            staticIcon={staticIcon}
            currentStepIndex={currentStepIndex}
          />
        )}
        label={label}
        status={status}
      />
    );
  },
);

export const ExampleChat = ({ start }: { start: boolean }) => {
  const promisesRef = useRef<any[]>([]);
  const [currentSampleIndex, setCurrentSampleIndex] = useState(0);
  const [showQuestion, setShowQuestion] = useState(true);
  const [showLoading, setShowLoading] = useState(false);
  const [showChainOfThought, setShowChainOfThought] = useState(false);
  const [chainOfThoughtOpen, setChainOfThoughtOpen] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [thinkingStartTime, setThinkingStartTime] = useState<number | null>(
    null,
  );
  const [thinkingDuration, setThinkingDuration] = useState<number | null>(null);
  const [isThinkingComplete, setIsThinkingComplete] = useState(false);

  useEffect(() => {
    if (!start) {
      promisesRef.current.forEach((cancel) => cancel());
      promisesRef.current = [];
      clearAll();
    } else {
      setShowQuestion(true);
    }
  }, [start]);

  const clearAll = () => {
    setShowQuestion(false);
    setShowLoading(false);
    setShowChainOfThought(false);
    setChainOfThoughtOpen(true);
    setShowAnswer(false);
    setShowFooter(false);
    setThinkingStartTime(null);
    setThinkingDuration(null);
    setIsThinkingComplete(false);
  };

  const showResults = async () => {
    setShowLoading(true);
    const afterShowLoading = wait(1000);
    promisesRef.current.push(afterShowLoading.cancel);
    await afterShowLoading.promise;

    const startTime = Date.now();
    setThinkingStartTime(startTime);
    setShowChainOfThought(true);
    setChainOfThoughtOpen(true);
    setCurrentStepIndex(-1);
    setIsThinkingComplete(false);

    const currentSample = samples[currentSampleIndex];
    for (let i = 0; i < currentSample.output.reasoning.length; i++) {
      setCurrentStepIndex(i);
      const stepDelay = wait(800); // Each step takes 800ms
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
    const afterCollapse = wait(300); // Wait for collapse animation
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
      return `Thought for ${thinkingDuration} second${thinkingDuration !== 1 ? "s" : ""}`;
    }
    return "Thinking...";
  }, [isThinkingComplete, thinkingDuration]);

  const reasoningSteps = useMemo(() => {
    return currentSample?.output.reasoning.map((step, index) => (
      <MemoizedChainOfThoughtStep
        key={index}
        stepIndex={index}
        staticIcon={step.icon}
        label={step.text}
        currentStepIndex={currentStepIndex}
      />
    ));
  }, [currentSample?.output.reasoning, currentStepIndex]);

  return (
    <section className={`container shadow-2xl shadow-emerald-900/50`}>
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
                <ChainOfThought open={chainOfThoughtOpen}>
                  <ChainOfThoughtHeader>
                    {chainOfThoughtHeaderText}
                  </ChainOfThoughtHeader>
                  <ChainOfThoughtContent>
                    {reasoningSteps}
                  </ChainOfThoughtContent>
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

const Typewriter = ({
  start,
  text,
  onTyped,
  onCleared,
  splitType = "letters",
  hideCursor,
}: {
  start: boolean;
  text: string;
  onTyped?: () => void;
  onCleared?: () => void;
  splitType?: "letters" | "words";
  hideCursor?: boolean;
}) => {
  const textContainerRef = useRef<HTMLDivElement>(null);
  const animatingRef = useRef(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    let i = 0;
    const splitBy = splitType === "letters" ? "" : " ";
    const splitText = text.split(splitBy);

    const write = () => {
      if (!textContainerRef.current || finishedRef.current) return;
      if (i < splitText.length) {
        animatingRef.current = true;
        textContainerRef.current.innerHTML = splitText
          .slice(0, i + 1)
          .join(splitBy);
        i++;
        setTimeout(write, 25);
      } else {
        animatingRef.current = false;
        finishedRef.current = true;
        i = 0;
        onTyped?.();
      }
    };

    const clear = () => {
      if (!textContainerRef.current || !finishedRef.current) return;
      if (i < splitText.length) {
        animatingRef.current = true;
        textContainerRef.current.innerHTML = splitText
          .slice(0, text.length - i)
          .join(splitBy);
        i++;
        setTimeout(clear, 5);
      } else {
        animatingRef.current = false;
        finishedRef.current = false;
        i = 0;
        textContainerRef.current.innerHTML = "";
        onCleared?.();
      }
    };

    if (animatingRef.current) return;

    if (start) {
      write();
    } else {
      clear();
    }
  }, [textContainerRef, start, text, onTyped, onCleared, splitType]);

  return (
    <div>
      <span ref={textContainerRef} />
      {!hideCursor && <span className="cursor">|</span>}
    </div>
  );
};

const Spinner = (props: React.SVGProps<SVGSVGElement>) => (
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
