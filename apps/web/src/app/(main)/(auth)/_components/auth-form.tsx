"use client";

import { useState } from "react";
import type { HTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import { Field, FieldError, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { toast } from "@repo/ui/components/toast";
import { cn } from "cn";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";

const CODE_LENGTH = 6;

const emailSchema = z.object({ email: z.email("Invalid email address") });

const codeSchema = z.object({
  code: z
    .string()
    .regex(new RegExp(`^\\d{${CODE_LENGTH}}$`, "u"), `Enter the ${CODE_LENGTH}-digit code`),
});

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
  const [resending, setResending] = useState(false);

  const form = useForm({
    defaultValues: {
      code: "",
    },
    resolver: zodResolver(codeSchema),
  });

  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  const handleSignIn = form.handleSubmit(async ({ code }) => {
    try {
      const { error } = await authClient.signIn.emailOtp({
        email,
        name: email.split("@")[0] ?? "User",
        otp: code,
      });

      if (error) {
        form.setError("root", { message: errorMessageOf(error) });

        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      form.setError("root", { message: "Unable to connect. Try again." });
    }
  });

  const resend = async () => {
    setResending(true);
    const failure = await sendCode(email);
    setResending(false);

    if (failure !== undefined) {
      form.setError("root", { message: failure });

      return;
    }

    form.clearErrors("root");
    toast.success(`Sent a new code to ${email}`);
  };

  return (
    <form
      className="grid gap-2"
      onSubmit={(e) => {
        void handleSignIn(e);
      }}
    >
      <p className="text-muted-foreground text-center text-sm">
        We sent a {CODE_LENGTH}-digit code to <span className="text-foreground">{email}</span>.
      </p>
      <Field>
        <FieldLabel className="sr-only" htmlFor="code">
          Sign-in code
        </FieldLabel>
        <Input
          id="code"
          data-test="code-input"
          required
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={CODE_LENGTH}
          placeholder={"0".repeat(CODE_LENGTH)}
          autoComplete="one-time-code"
          className="text-center font-mono tracking-[0.5em]"
          aria-invalid={errors.code ? true : undefined}
          {...register("code")}
        />
        <FieldError errors={errors.code ? [errors.code] : undefined} />
      </Field>
      <FieldError errors={errors.root ? [errors.root] : undefined} />
      <Button type="submit" loading={isSubmitting}>
        Sign in
      </Button>
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
    </form>
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
