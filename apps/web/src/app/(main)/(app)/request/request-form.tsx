"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
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
import { UploadIcon, XIcon } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { orpc } from "@/orpc/react";

const splitLines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

// The textarea holds one URL per line; the API wants an array.
const formSchema = componentRequestSchema.omit({ references: true, attachments: true }).extend({
  references: z
    .string()
    .refine((value) => splitLines(value).length <= MAX_REFERENCE_LINKS, {
      message: `At most ${MAX_REFERENCE_LINKS} links`,
    })
    .refine((value) => splitLines(value).every((line) => z.url().safeParse(line).success), {
      message: "One full URL per line",
    }),
});

type Attachment = {
  id: string;
  name: string;
  kind: "image" | "video";
  previewUrl: string;
  status: "uploading" | "done" | "error";
  url?: string;
  error?: string;
};

const isAttachmentType = (type: string): type is keyof typeof ATTACHMENT_TYPES =>
  type in ATTACHMENT_TYPES;

const ACCEPT = Object.keys(ATTACHMENT_TYPES).join(",");
const MAX_MB = Math.round(ATTACHMENT_MAX_BYTES / 1024 / 1024);

const uploadResponseSchema = z.object({
  url: z.string().optional(),
  message: z.string().optional(),
});

const uploadFile = async (file: File): Promise<string> => {
  const body = new FormData();
  body.set("file", file);
  const res = await fetch("/api/request/attachments", { method: "POST", body });
  const parsed = uploadResponseSchema.safeParse(await res.json().catch(() => ({})));
  if (!res.ok || !parsed.success || !parsed.data.url) {
    throw new Error(parsed.success && parsed.data.message ? parsed.data.message : "Upload failed");
  }
  return parsed.data.url;
};

type Filed = { url: string; number?: number };

export const RequestForm = ({ className }: { className?: string }) => {
  const [filed, setFiled] = useState<Filed | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const create = useMutation(orpc.request.create.mutationOptions());

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      references: "",
      credit: { name: "", url: "" },
      website: "",
    },
  });
  const {
    register,
    control,
    formState: { errors, isSubmitting },
  } = form;
  const name = useWatch({ control, name: "name" });

  useEffect(
    () => () => attachments.forEach((attachment) => URL.revokeObjectURL(attachment.previewUrl)),
    [attachments],
  );

  const addFiles = (files: FileList | File[]) => {
    const room = ATTACHMENT_MAX_COUNT - attachments.length;
    for (const file of Array.from(files).slice(0, Math.max(room, 0))) {
      if (!isAttachmentType(file.type)) continue;
      const id = crypto.randomUUID();
      const next: Attachment = {
        id,
        name: file.name,
        kind: ATTACHMENT_TYPES[file.type],
        previewUrl: URL.createObjectURL(file),
        status: file.size > ATTACHMENT_MAX_BYTES ? "error" : "uploading",
        error: file.size > ATTACHMENT_MAX_BYTES ? `Over ${MAX_MB} MB` : undefined,
      };
      setAttachments((current) => [...current, next]);
      if (next.status === "error") continue;
      void (async () => {
        try {
          const url = await uploadFile(file);
          setAttachments((current) =>
            current.map((a) => (a.id === id ? { ...a, status: "done", url } : a)),
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Upload failed";
          setAttachments((current) =>
            current.map((a) => (a.id === id ? { ...a, status: "error", error: message } : a)),
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
      const result = await create.mutateAsync({
        ...values,
        references: splitLines(values.references),
        attachments: attachments.flatMap((a) => (a.status === "done" && a.url ? [a.url] : [])),
      });
      setFiled(result);
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Unable to file the request. Try again.",
      });
    }
  });

  const cardLabel = filed
    ? filed.number
      ? `Filed · #${filed.number}`
      : "Filed"
    : name.trim() || "Your request";

  return (
    <form
      className={cn("grid gap-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-12", className)}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-3 max-lg:order-first lg:sticky lg:top-24 lg:self-start lg:order-last">
        <div
          role="button"
          tabIndex={filed ? -1 : 0}
          aria-label="Attach a recording or screenshot"
          aria-disabled={Boolean(filed)}
          onClick={() => !filed && fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!filed) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "bg-background group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border border-dashed transition-colors outline-none",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
            dragging ? "border-primary bg-primary/5" : "hover:border-foreground/40",
            featured && "border-solid",
            filed && "cursor-default",
          )}
        >
          {featured ? (
            featured.kind === "video" ? (
              <video
                src={featured.previewUrl}
                className="size-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img src={featured.previewUrl} alt="" className="size-full object-cover" />
            )
          ) : (
            <div className="text-muted-foreground flex flex-col items-center gap-2 px-6 text-center">
              <UploadIcon className="size-4" aria-hidden />
              <span className="text-sm">Drop a recording or screenshot</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="sr-only"
            tabIndex={-1}
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
        <div className="flex justify-between font-mono text-xs">
          <p className={cn("truncate", filed ? "text-primary" : "text-foreground")}>{cardLabel}</p>
          <p className="text-muted-foreground/50">REQ</p>
        </div>
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
                {attachment.kind === "video" ? (
                  <video src={attachment.previewUrl} className="size-full object-cover" muted />
                ) : (
                  <img src={attachment.previewUrl} alt="" className="size-full object-cover" />
                )}
                {attachment.status === "uploading" && (
                  <span className="bg-background/60 absolute inset-0 animate-pulse" />
                )}
                {!filed && (
                  <button
                    type="button"
                    aria-label={`Remove ${attachment.name}`}
                    onClick={() => removeAttachment(attachment.id)}
                    className="bg-background/80 text-foreground absolute top-0.5 right-0.5 rounded-full p-0.5 opacity-0 transition group-hover/thumb:opacity-100 focus-visible:opacity-100"
                  >
                    <XIcon className="size-3" aria-hidden />
                  </button>
                )}
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

      {filed ? (
        <div className="flex flex-col gap-3 self-center">
          <p className="text-lg">Filed. Thank you.</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            It's public on GitHub now. If it's accepted it gets a <code>ready</code> label, then it
            gets built.
          </p>
          <Button
            render={<a href={filed.url} target="_blank" rel="noreferrer" />}
            nativeButton={false}
            variant="outline"
            className="self-start rounded-full"
          >
            Follow it on GitHub
          </Button>
        </div>
      ) : (
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
              The best entries import an interaction from outside the web and read from motion
              alone. A nicer dropdown won't make it.
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
      )}
    </form>
  );
};
