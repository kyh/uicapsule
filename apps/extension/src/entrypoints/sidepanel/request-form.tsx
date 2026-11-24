import { useState } from "react";
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
import { componentRequestSchema } from "@repo/contract/request/request-schema";
import { RotateCcw } from "lucide-react";

import { fileRequest, uploadAttachment } from "@/lib/api";
import { parseReferences } from "@/lib/references";
import { creditItem } from "@/lib/storage";

import type { Capture, Filed } from "./types";
import { FALLBACK_ERROR } from "./types";

type ErrorKey = "credit.name" | "credit.url" | "description" | "name" | "references";

type Errors = Partial<Record<ErrorKey, string>>;

const FIELD_KEYS = new Set<string>(["credit.name", "credit.url", "description", "name"]);

const isErrorKey = (key: string): key is ErrorKey => FIELD_KEYS.has(key);

const invalid = (message: string | undefined) => (message ? true : undefined);

export const RequestForm = (props: {
  busy: boolean;
  capture: Capture;
  credit: { name: string; url: string };
  onCreditChange: (credit: { name: string; url: string }) => void;
  onFiled: (filed: Filed) => void;
  onReferencesChange: (value: string) => void;
  onReset: () => void;
  references: string;
  serviceUrl: string;
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [problem, setProblem] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { credit } = props;

  const updateCredit = (next: { name: string; url: string }) => {
    props.onCreditChange(next);
    void creditItem.setValue(next);
  };

  const validate = () => {
    const references = parseReferences(props.references);
    const { element, page } = props.capture.selection;

    const request = componentRequestSchema.safeParse({
      attachments: [],
      capture: { html: element?.html, selector: element?.selector, url: page.url },
      credit,
      description,
      name,
      references: references.ok ? references.references : [],
    });

    const next: Errors = references.ok ? {} : { references: references.error };

    for (const issue of request.error?.issues ?? []) {
      const key = issue.path.join(".");

      if (isErrorKey(key)) {
        next[key] ??= issue.message;
      }
    }

    setErrors(next);

    return Object.keys(next).length === 0 && request.success ? request.data : null;
  };

  const send = async (request: NonNullable<ReturnType<typeof validate>>) => {
    const attachments: string[] = [];

    for (const media of props.capture.media) {
      attachments.push(await uploadAttachment(props.serviceUrl, media.file));
    }

    return fileRequest(props.serviceUrl, { ...request, attachments });
  };

  const submit = async () => {
    const request = validate();

    if (!request) {
      return;
    }

    setProblem(null);
    setSubmitting(true);

    try {
      const filed = await send(request);
      setSubmitting(false);
      props.onFiled(filed);
    } catch (error) {
      setSubmitting(false);
      setProblem(error instanceof Error ? error.message : FALLBACK_ERROR);
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <FieldGroup className="gap-4">
        <Field data-invalid={invalid(errors.name)}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            value={name}
            placeholder="Shutter button"
            aria-invalid={invalid(errors.name)}
            onChange={(event) => setName(event.target.value)}
          />
          <FieldError>{errors.name}</FieldError>
        </Field>
        <Field data-invalid={invalid(errors.description)}>
          <FieldLabel htmlFor="description">What does it do?</FieldLabel>
          <Textarea
            id="description"
            value={description}
            rows={4}
            placeholder="Describe the interaction: what moves, and what it responds to."
            aria-invalid={invalid(errors.description)}
            onChange={(event) => setDescription(event.target.value)}
          />
          <FieldError>{errors.description}</FieldError>
        </Field>
        <Field data-invalid={invalid(errors.references)}>
          <FieldLabel htmlFor="references">Other links</FieldLabel>
          <Textarea
            id="references"
            value={props.references}
            rows={2}
            placeholder="One URL per line"
            aria-invalid={invalid(errors.references)}
            onChange={(event) => props.onReferencesChange(event.target.value)}
          />
          <FieldDescription>The page you captured is included already.</FieldDescription>
          <FieldError>{errors.references}</FieldError>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field data-invalid={invalid(errors["credit.name"])}>
            <FieldLabel htmlFor="credit-name">Credit name</FieldLabel>
            <Input
              id="credit-name"
              value={credit.name}
              placeholder="Optional"
              aria-invalid={invalid(errors["credit.name"])}
              onChange={(event) => updateCredit({ ...credit, name: event.target.value })}
            />
            <FieldError>{errors["credit.name"]}</FieldError>
          </Field>
          <Field data-invalid={invalid(errors["credit.url"])}>
            <FieldLabel htmlFor="credit-url">Credit link</FieldLabel>
            <Input
              id="credit-url"
              value={credit.url}
              placeholder="Optional"
              aria-invalid={invalid(errors["credit.url"])}
              onChange={(event) => updateCredit({ ...credit, url: event.target.value })}
            />
            <FieldError>{errors["credit.url"]}</FieldError>
          </Field>
        </div>
        {problem && <p className="text-sm text-destructive">{problem}</p>}
        <div className="flex items-center gap-2">
          <Button type="submit" loading={submitting} disabled={props.busy}>
            File request
          </Button>
          <Button type="button" variant="ghost" onClick={props.onReset} disabled={submitting}>
            <RotateCcw />
            Start over
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
};
