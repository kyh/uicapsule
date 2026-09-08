"use client";

import { useState } from "react";
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
import { useMutation } from "@tanstack/react-query";
import { cn } from "cn";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { orpc } from "@/orpc/react";

const splitLines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

// The textarea holds one URL per line; the API wants an array.
const formSchema = componentRequestSchema.omit({ references: true }).extend({
  references: z
    .string()
    .refine((value) => splitLines(value).length <= MAX_REFERENCE_LINKS, {
      message: `At most ${MAX_REFERENCE_LINKS} links`,
    })
    .refine((value) => splitLines(value).every((line) => z.url().safeParse(line).success), {
      message: "One full URL per line",
    }),
});

type Filed = { url: string; number?: number };

export const RequestForm = ({ className }: { className?: string }) => {
  const [filed, setFiled] = useState<Filed | null>(null);
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
    formState: { errors, isSubmitting },
  } = form;

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await create.mutateAsync({
        ...values,
        references: splitLines(values.references),
      });
      setFiled(result);
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Unable to file the request. Try again.",
      });
    }
  });

  if (filed) {
    return (
      <div className={cn("flex flex-col gap-2 border-t pt-4", className)}>
        <p>Filed{filed.number ? ` as issue #${filed.number}` : ""}. Thank you.</p>
        <p className="text-muted-foreground text-sm">
          Follow it on{" "}
          <a
            href={filed.url}
            target="_blank"
            rel="noreferrer"
            className="hover:text-primary underline decoration-dotted transition-colors"
          >
            GitHub
          </a>
          . Accepted requests get a <code>ready</code> label before they are built.
        </p>
      </div>
    );
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit}>
      <FieldGroup>
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
            placeholder="Describe the motion and the states. What does it do on press, on release, at rest?"
            aria-invalid={errors.description ? true : undefined}
            {...register("description")}
          />
          <FieldDescription>
            The best entries import an interaction from outside the web and read from motion alone.
            A nicer dropdown won't make it.
          </FieldDescription>
          <FieldError errors={errors.description ? [errors.description] : undefined} />
        </Field>
        <Field>
          <FieldLabel htmlFor="request-references">Where you saw it</FieldLabel>
          <Textarea
            id="request-references"
            rows={3}
            placeholder={"https://x.com/…/status/…\nhttps://youtu.be/…"}
            aria-invalid={errors.references ? true : undefined}
            {...register("references")}
          />
          <FieldDescription>
            One link per line. A tweet, a video, an app, a product page. These get credited on the
            component.
          </FieldDescription>
          <FieldError errors={errors.references ? [errors.references] : undefined} />
        </Field>
        <Field orientation="responsive">
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
        </Field>
        <Input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="hidden"
          {...register("website")}
        />
      </FieldGroup>
      <FieldError errors={errors.root ? [errors.root] : undefined} />
      <Button type="submit" loading={isSubmitting} className="self-start">
        File request
      </Button>
    </form>
  );
};
