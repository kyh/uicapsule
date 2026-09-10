"use client";

import { useEffect, useRef, useState } from "react";
import type { DragEvent, ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { componentRequestSchema, MAX_REFERENCE_LINKS } from "@repo/api/request/component-request";
import {
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MAX_COUNT,
  ATTACHMENT_TYPES,
} from "@repo/api/request/github-attachment";
import { useMutation } from "@tanstack/react-query";
import { cn } from "cn";
import { ArrowUpRightIcon, UploadIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Transition } from "motion/react";
import { useMediaQuery } from "@repo/ui/hooks/use-media-query";
import { useForm } from "react-hook-form";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { z } from "zod";

import { orpc } from "@/orpc/react";

const splitLines = (value: string) =>
  value
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

// The textarea holds one URL per line; the API wants an array.
const formSchema = componentRequestSchema.omit({ attachments: true, references: true }).extend({
  references: z
    .string()
    .refine((value) => splitLines(value).length <= MAX_REFERENCE_LINKS, {
      message: `At most ${MAX_REFERENCE_LINKS} links`,
    })
    .refine((value) => splitLines(value).every((line) => z.url().safeParse(line).success), {
      message: "One full URL per line",
    }),
});

type FormValues = z.infer<typeof formSchema>;

interface Attachment {
  id: string;
  name: string;
  kind: "image" | "video";
  previewUrl: string;
  status: "uploading" | "done" | "error";
  url?: string;
  error?: string;
}

const isAttachmentType = (type: string): type is keyof typeof ATTACHMENT_TYPES =>
  type in ATTACHMENT_TYPES;

const ACCEPT = Object.keys(ATTACHMENT_TYPES).join(",");
const MAX_MB = Math.round(ATTACHMENT_MAX_BYTES / 1024 / 1024);

const uploadResponseSchema = z.object({
  message: z.string().optional(),
  url: z.string().optional(),
});

const uploadFile = async (file: File): Promise<string> => {
  const body = new FormData();
  body.set("file", file);
  const res = await fetch("/api/request/attachments", { body, method: "POST" });
  const parsed = uploadResponseSchema.safeParse(await res.json().catch(() => ({})));
  if (!res.ok || !parsed.success || !parsed.data.url) {
    throw new Error(parsed.success && parsed.data.message ? parsed.data.message : "Upload failed");
  }
  return parsed.data.url;
};

interface Filed {
  attachments: number;
  filedAt: string;
  links: number;
  name: string;
  number?: number;
  url: string;
}

const reveal = {
  hidden: { filter: "blur(4px)", opacity: 0 },
  shown: { filter: "blur(0px)", opacity: 1 },
};
const revealTransition: Transition = { duration: 0.3, ease: "easeOut" };
const strokeTransition = (delay: number): Transition => ({
  delay,
  duration: 0.6,
  ease: "easeInOut",
});

const ReceiptArt = () => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className="size-28"
  >
    <motion.circle
      cx="60"
      cy="60"
      r="46"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={strokeTransition(0.55)}
    />
    <motion.circle
      cx="60"
      cy="66"
      r="32"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={strokeTransition(0.7)}
    />
    <motion.circle
      cx="60"
      cy="72"
      r="19"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={strokeTransition(0.85)}
    />
    <motion.path
      d="M50 72l7 7 14-15"
      strokeWidth="2"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ damping: 22, delay: 1.25, stiffness: 260, type: "spring" }}
    />
  </svg>
);

const CORNERS = [
  "top-2 left-2 border-t border-l",
  "top-2 right-2 border-t border-r",
  "bottom-2 left-2 border-b border-l",
  "bottom-2 right-2 border-b border-r",
];

const ReceiptRow = ({ label, value }: { label: string; value: string }) => (
  <motion.div
    variants={reveal}
    transition={revealTransition}
    className="flex items-baseline gap-2 font-mono text-xs"
  >
    <dt className="text-muted-foreground shrink-0">{label}</dt>
    <span aria-hidden className="border-border mb-1 flex-1 border-b border-dotted" />
    <dd className="truncate">{value}</dd>
  </motion.div>
);

// Each half punches its own seam corners; together they read as holes through the ticket.
// The shell is border-colored and punched 1px tighter than its content, so the rim follows the hole.
const HOLE_MASK =
  "radial-gradient(circle at var(--hole-a), transparent var(--hole-r), black calc(var(--hole-r) + 0.5px)), radial-gradient(circle at var(--hole-b), transparent var(--hole-r), black calc(var(--hole-r) + 0.5px))";
const holeStyle = { maskComposite: "intersect", maskImage: HOLE_MASK };

const TicketShell = ({ className, children }: { className: string; children: ReactNode }) => (
  <div style={holeStyle} className={cn("bg-border rounded-lg p-px [--hole-r:10px]", className)}>
    {children}
  </div>
);

const Receipt = ({ filed }: { filed: Filed }) => {
  const horizontal = useMediaQuery();
  // The stub hinges open on its seam edge, so the axis follows the layout.
  const fold = horizontal
    ? { hidden: { rotateY: -90 }, shown: { rotateY: 0 } }
    : { hidden: { rotateX: 90 }, shown: { rotateX: 0 } };
  const rows: { label: string; value: string | null }[] = [
    { label: "Name", value: filed.name },
    { label: "Links", value: filed.links > 0 ? String(filed.links) : null },
    { label: "Attachments", value: filed.attachments > 0 ? String(filed.attachments) : null },
    { label: "Issue", value: filed.number === undefined ? null : `#${filed.number}` },
    { label: "Filed", value: filed.filedAt },
  ];
  const number = filed.number === undefined ? "Filed" : `No. ${filed.number}`;
  return (
    <motion.div
      initial="hidden"
      animate="shown"
      className="flex w-full max-w-sm flex-col sm:max-w-3xl sm:flex-row"
    >
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          shown: {
            opacity: 1,
            transition: { delayChildren: 0.15, duration: 0.3, staggerChildren: 0.08 },
          },
        }}
        className="flex min-w-0 flex-col sm:flex-1"
      >
        <TicketShell className="flex min-w-0 flex-1 flex-col [--hole-a:0_100%] [--hole-b:100%_100%] max-sm:pb-0 sm:pr-0 sm:[--hole-a:100%_0] sm:[--hole-b:100%_100%]">
          <div
            style={holeStyle}
            className="bg-muted text-card-foreground dark:bg-card relative flex min-w-0 flex-1 flex-col rounded-[7px] [--hole-r:11px] [--hole-a:-1px_calc(100%_+_1px)] [--hole-b:calc(100%_+_1px)_calc(100%_+_1px)] sm:[--hole-a:calc(100%_+_1px)_-1px] sm:[--hole-b:calc(100%_+_1px)_calc(100%_+_1px)]"
          >
            <motion.div
              variants={reveal}
              transition={revealTransition}
              className="flex items-center justify-between border-b border-dashed px-4 py-2.5 font-mono text-[10px] tracking-[0.2em] uppercase"
            >
              <span className="text-muted-foreground">Component request</span>
              <span>{number}</span>
            </motion.div>
            <div className="flex flex-1 flex-col sm:flex-row">
              <motion.div
                variants={reveal}
                transition={revealTransition}
                className="relative m-3 flex aspect-[4/3] items-center justify-center bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] bg-[size:8px_8px] sm:aspect-square sm:w-72 sm:shrink-0"
              >
                {CORNERS.map((corner) => (
                  <span
                    key={corner}
                    aria-hidden
                    className={cn("border-foreground/40 absolute size-2", corner)}
                  />
                ))}
                <ReceiptArt />
              </motion.div>
              <dl className="flex min-w-0 flex-col gap-1.5 px-4 pb-4 sm:flex-1 sm:justify-center sm:py-4 sm:pl-2">
                {rows.map(({ label, value }) =>
                  value === null ? null : <ReceiptRow key={label} label={label} value={value} />,
                )}
              </dl>
            </div>
            <span
              aria-hidden
              className="absolute inset-x-4 bottom-0 border-t border-dashed sm:inset-x-auto sm:inset-y-4 sm:right-0 sm:border-t-0 sm:border-l"
            />
          </div>
        </TicketShell>
      </motion.div>
      <motion.div
        variants={fold}
        transition={{ bounce: 0.2, delay: 0.3, type: "spring", visualDuration: 0.7 }}
        style={{ transformPerspective: 1200 }}
        className="flex origin-top flex-col backface-hidden sm:w-60 sm:shrink-0 sm:origin-left"
      >
        <TicketShell className="flex flex-1 flex-col [--hole-a:0_0] [--hole-b:100%_0] max-sm:pt-0 sm:pl-0 sm:[--hole-a:0_0] sm:[--hole-b:0_100%]">
          <div
            style={holeStyle}
            className="bg-primary text-primary-foreground flex flex-1 flex-col rounded-[7px] [--hole-r:11px] [--hole-a:-1px_-1px] [--hole-b:calc(100%_+_1px)_-1px] sm:[--hole-a:-1px_-1px] sm:[--hole-b:-1px_calc(100%_+_1px)]"
          >
            <div className="border-primary-foreground/30 flex items-center justify-between border-b border-dashed px-4 py-2.5 font-mono text-[10px] tracking-[0.2em] uppercase">
              <span className="opacity-70">Stub</span>
              <span>{number}</span>
            </div>
            <div className="flex flex-1 flex-col gap-2 px-4 py-4 sm:justify-center">
              <p className="text-lg font-medium">Filed. Thank you.</p>
              <p className="text-xs leading-relaxed opacity-85">
                It&apos;s public on GitHub now. If it&apos;s accepted it gets a <code>ready</code>{" "}
                label, then it gets built.
              </p>
            </div>
            <div className="px-4 pb-4">
              <a
                href={filed.url}
                target="_blank"
                rel="noreferrer"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 flex h-9 items-center justify-center gap-1 rounded-full text-sm font-medium transition-colors"
              >
                Follow it on GitHub
                <ArrowUpRightIcon className="size-3.5" aria-hidden />
              </a>
            </div>
          </div>
        </TicketShell>
      </motion.div>
    </motion.div>
  );
};

const AttachmentMedia = ({
  attachment,
  autoPlay = false,
}: {
  attachment: Attachment;
  autoPlay?: boolean;
}) => {
  if (attachment.kind === "video") {
    return (
      <video
        src={attachment.previewUrl}
        className="size-full object-cover"
        autoPlay={autoPlay}
        muted
        loop={autoPlay}
        playsInline={autoPlay}
      />
    );
  }
  // oxlint-disable-next-line next/no-img-element -- object URL preview; nothing for next/image to optimize
  return <img src={attachment.previewUrl} alt="" className="size-full object-cover" />;
};

interface RequestFieldsProps {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  isSubmitting: boolean;
  uploading: boolean;
}

const RequestFields = ({ register, errors, isSubmitting, uploading }: RequestFieldsProps) => (
  <FieldGroup className="gap-5">
    <Field>
      <FieldLabel htmlFor="request-name">Name</FieldLabel>
      <Input
        id="request-name"
        placeholder="Shutter button"
        autoComplete="off"
        aria-invalid={errors.name ? true : undefined}
        {...register("name")}
      />
      <FieldError errors={errors.name ? [errors.name] : undefined} />
    </Field>
    <Field>
      <FieldLabel htmlFor="request-description">What it does</FieldLabel>
      <Textarea
        id="request-description"
        rows={5}
        placeholder="The motion and the states. What happens on press, on release, at rest?"
        aria-invalid={errors.description ? true : undefined}
        {...register("description")}
      />
      <FieldDescription className="text-muted-foreground/70 text-xs">
        The best entries import an interaction from outside the web and read from motion alone. A
        nicer dropdown won&apos;t make it.
      </FieldDescription>
      <FieldError errors={errors.description ? [errors.description] : undefined} />
    </Field>
    <Field>
      <FieldLabel htmlFor="request-references">Where you saw it</FieldLabel>
      <Textarea
        id="request-references"
        rows={2}
        placeholder={"https://x.com/…/status/…\nhttps://youtu.be/…"}
        aria-invalid={errors.references ? true : undefined}
        {...register("references")}
      />
      <FieldDescription className="text-muted-foreground/70 text-xs">
        One link per line. Optional if you attached a recording.
      </FieldDescription>
      <FieldError errors={errors.references ? [errors.references] : undefined} />
    </Field>
    <div className="grid grid-cols-2 gap-3">
      <Field>
        <FieldLabel htmlFor="request-credit-name">Your name</FieldLabel>
        <Input
          id="request-credit-name"
          placeholder="Optional"
          autoComplete="name"
          aria-invalid={errors.credit?.name ? true : undefined}
          {...register("credit.name")}
        />
        <FieldError errors={errors.credit?.name ? [errors.credit.name] : undefined} />
      </Field>
      <Field>
        <FieldLabel htmlFor="request-credit-url">Your link</FieldLabel>
        <Input
          id="request-credit-url"
          placeholder="https://github.com/you"
          autoComplete="url"
          inputMode="url"
          aria-invalid={errors.credit?.url ? true : undefined}
          {...register("credit.url")}
        />
        <FieldError errors={errors.credit?.url ? [errors.credit.url] : undefined} />
      </Field>
    </div>
    <Input
      type="text"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden
      className="hidden"
      {...register("website")}
    />
    <FieldError errors={errors.root ? [errors.root] : undefined} />
    <Button
      type="submit"
      loading={isSubmitting}
      disabled={uploading}
      className="self-start rounded-full"
    >
      {uploading ? "Uploading…" : "File request"}
    </Button>
  </FieldGroup>
);

export const RequestForm = ({ className }: { className?: string }) => {
  const [filed, setFiled] = useState<Filed | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const create = useMutation(orpc.request.create.mutationOptions());

  const form = useForm({
    defaultValues: {
      credit: { name: "", url: "" },
      description: "",
      name: "",
      references: "",
      website: "",
    },
    resolver: zodResolver(formSchema),
  });
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(
    () => () => {
      for (const attachment of attachments) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    },
    [attachments],
  );

  const addFiles = (files: FileList | File[]) => {
    const room = ATTACHMENT_MAX_COUNT - attachments.length;
    for (const file of [...files].slice(0, Math.max(room, 0))) {
      if (!isAttachmentType(file.type)) {
        continue;
      }
      const id = crypto.randomUUID();
      const next: Attachment = {
        error: file.size > ATTACHMENT_MAX_BYTES ? `Over ${MAX_MB} MB` : undefined,
        id,
        kind: ATTACHMENT_TYPES[file.type],
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        status: file.size > ATTACHMENT_MAX_BYTES ? "error" : "uploading",
      };
      setAttachments((current) => [...current, next]);
      if (next.status === "error") {
        continue;
      }
      void (async () => {
        try {
          const url = await uploadFile(file);
          setAttachments((current) =>
            current.map((a) => (a.id === id ? { ...a, status: "done", url } : a)),
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Upload failed";
          setAttachments((current) =>
            current.map((a) => (a.id === id ? { ...a, error: message, status: "error" } : a)),
          );
        }
      })();
    }
  };

  const removeAttachment = (id: string) =>
    setAttachments((current) => current.filter((a) => a.id !== id));

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const uploading = attachments.some((a) => a.status === "uploading");
  const featured = attachments.findLast((a) => a.status !== "error") ?? attachments.at(-1);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const uploaded = attachments.flatMap((a) => (a.status === "done" && a.url ? [a.url] : []));
      const references = splitLines(values.references);
      const result = await create.mutateAsync({ ...values, attachments: uploaded, references });
      setFiled({
        ...result,
        attachments: uploaded.length,
        filedAt: new Date().toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        links: references.length,
        name: values.name,
      });
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Unable to file the request. Try again.",
      });
    }
  });

  return (
    <AnimatePresence mode="wait" initial={false}>
      {filed ? (
        <Receipt key="filed" filed={filed} />
      ) : (
        <motion.form
          key="form"
          exit={{ filter: "blur(4px)", opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: "easeIn" }}
          className={cn(
            "grid gap-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-12",
            className,
          )}
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-3 max-lg:order-first lg:sticky lg:top-24 lg:self-start lg:order-last">
            <button
              type="button"
              aria-label="Attach a recording or screenshot"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "bg-background group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border border-dashed transition-colors outline-none",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
                dragging ? "border-primary bg-primary/5" : "hover:border-foreground/40",
                featured && "border-solid",
              )}
            >
              {featured ? (
                <AttachmentMedia attachment={featured} autoPlay />
              ) : (
                <div className="text-muted-foreground flex flex-col items-center gap-2 px-6 text-center">
                  <UploadIcon className="size-4" aria-hidden />
                  <span className="text-sm">Drop a recording or screenshot</span>
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => {
                if (event.target.files) {
                  addFiles(event.target.files);
                }
                event.target.value = "";
              }}
            />
            {attachments.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <li
                    key={attachment.id}
                    className={cn(
                      "group/thumb relative size-14 overflow-hidden rounded-md border",
                      attachment.status === "error" && "border-destructive opacity-60",
                    )}
                    title={attachment.error ?? attachment.name}
                  >
                    <AttachmentMedia attachment={attachment} />
                    {attachment.status === "uploading" && (
                      <span className="bg-background/60 absolute inset-0 animate-pulse" />
                    )}
                    <button
                      type="button"
                      aria-label={`Remove ${attachment.name}`}
                      onClick={() => removeAttachment(attachment.id)}
                      className="bg-background/80 text-foreground absolute top-0.5 right-0.5 rounded-full p-0.5 opacity-0 transition group-hover/thumb:opacity-100 focus-visible:opacity-100"
                    >
                      <XIcon className="size-3" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {attachments.some((a) => a.status === "error") && (
              <p className="text-destructive text-xs">
                {attachments.find((a) => a.status === "error")?.error}
              </p>
            )}
          </div>

          <RequestFields
            register={register}
            errors={errors}
            isSubmitting={isSubmitting}
            uploading={uploading}
          />
        </motion.form>
      )}
    </AnimatePresence>
  );
};
