"use client";

import { useRef, useState } from "react";
import type { HTMLAttributes } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import { Field, FieldError, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { OTPInput } from "@repo/ui/components/otp-input";
import { toast } from "@repo/ui/components/toast";
import { cn } from "cn";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";

const CODE_LENGTH = 6;

const emailSchema = z.object({ email: z.email("Invalid email address") });

const continuationSchema = z.object({ redirect: z.literal(true), url: z.string() });

const CODE_ERRORS = new Map([
  ["INVALID_OTP", "That code isn't right. Check it and try again."],
  ["OTP_EXPIRED", "That code has expired. Send a new one."],
  ["TOO_MANY_ATTEMPTS", "Too many tries. Send a new code."],
]);

const errorMessageOf = (error: { code?: string; message?: string }) =>
  CODE_ERRORS.get(error.code ?? "") ?? error.message ?? "Something went wrong. Try again.";

const sendCode = async (email: string) => {
  try {
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });

    return error ? errorMessageOf(error) : undefined;
  } catch {
    return "Unable to connect. Try again.";
  }
};

const EmailStep = ({ onSent }: { onSent: (email: string) => void }) => {
  const form = useForm({
    defaultValues: {
      email: "",
    },
    resolver: zodResolver(emailSchema),
  });

  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  const handleSendCode = form.handleSubmit(async ({ email }) => {
    const failure = await sendCode(email);

    if (failure !== undefined) {
      form.setError("root", { message: failure });

      return;
    }

    onSent(email);
  });

  return (
    <form
      className="grid gap-2"
      onSubmit={(e) => {
        void handleSendCode(e);
      }}
    >
      <Field>
        <FieldLabel className="sr-only" htmlFor="email">
          Email
        </FieldLabel>
        <Input
          id="email"
          data-test="email-input"
          required
          type="email"
          placeholder="name@example.com"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
          aria-invalid={errors.email ? true : undefined}
          {...register("email")}
        />
        <FieldError errors={errors.email ? [errors.email] : undefined} />
      </Field>
      <FieldError errors={errors.root ? [errors.root] : undefined} />
      <Button type="submit" loading={isSubmitting}>
        Continue with email
      </Button>
    </form>
  );
};

const CodeStep = ({ email, onBack }: { email: string; onBack: () => void }) => {
  const router = useRouter();
  const continuation = useRef<string>(undefined);
  const [resending, setResending] = useState(false);
  const [failure, setFailure] = useState<string>();

  const resend = async () => {
    setResending(true);
    const sendFailure = await sendCode(email);
    setResending(false);
    setFailure(sendFailure);

    if (sendFailure === undefined) {
      toast.success(`Sent a new code to ${email}`);
    }
  };

  return (
    <div className="grid gap-4">
      <p className="text-muted-foreground text-center text-sm">
        We sent a {CODE_LENGTH}-digit code to <span className="text-foreground">{email}</span>.
      </p>
      <Field className="items-center">
        <FieldLabel className="sr-only" htmlFor="code">
          Sign-in code
        </FieldLabel>
        <OTPInput
          id="code"
          data-test="code-input"
          length={CODE_LENGTH}
          group
          autoFocus
          onInput={() => {
            setFailure(undefined);
          }}
          verify={async (otp) => {
            try {
              const { data, error } = await authClient.signIn.emailOtp({
                email,
                name: email.split("@")[0] ?? "User",
                otp,
              });

              continuation.current = continuationSchema.safeParse(data).data?.url;

              setFailure(error ? errorMessageOf(error) : undefined);

              return !error;
            } catch {
              setFailure("Unable to connect. Try again.");

              return false;
            }
          }}
          onSuccess={() => {
            if (continuation.current !== undefined) {
              window.location.assign(continuation.current);

              return;
            }

            router.replace("/");
            router.refresh();
          }}
        />
        <FieldError
          className="text-center"
          errors={failure === undefined ? undefined : [{ message: failure }]}
        />
      </Field>
      <div className="flex justify-between">
        <Button variant="link" size="sm" type="button" onClick={onBack}>
          Use a different email
        </Button>
        <Button
          variant="link"
          size="sm"
          type="button"
          loading={resending}
          onClick={() => {
            void resend();
          }}
        >
          Resend code
        </Button>
      </div>
    </div>
  );
};

export const AuthForm = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  const [email, setEmail] = useState<string>();

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      {email === undefined ? (
        <EmailStep onSent={setEmail} />
      ) : (
        <CodeStep
          email={email}
          onBack={() => {
            setEmail(undefined);
          }}
        />
      )}
    </div>
  );
};

/** A link to the other auth page that keeps the query, so a sign-in an app started carries over. */
export const AuthSwitchLink = ({ children, href }: { children: string; href: string }) => {
  const search = useSearchParams().toString();

  return (
    <Link href={search === "" ? href : `${href}?${search}`} className="underline">
      {children}
    </Link>
  );
};
