"use client";

import { useState, type HTMLAttributes } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/button";
import { Field, FieldError, FieldLabel } from "@repo/ui/components/field";
import { Input } from "@repo/ui/components/input";
import { toast } from "@repo/ui/components/sonner";
import { cn } from "@repo/ui/lib/utils";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";

type AuthFormProps = {
  type: "login" | "register";
} & HTMLAttributes<HTMLDivElement>;

export const AuthForm = ({ className, type, ...props }: AuthFormProps) => {
  const router = useRouter();
  const params = useParams<{ nextPath?: string }>();
  const [submittingGithub, setSubmittingGithub] = useState(false);

  const form = useForm({
    resolver: zodResolver(
      z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
      }),
    ),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  const handleAuthWithGithub = async () => {
    setSubmittingGithub(true);
    await authClient.signIn.social({
      provider: "github",
      fetchOptions: {
        onSuccess: () => {
          router.replace(params.nextPath ?? "/dashboard");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
        onResponse: () => {
          setSubmittingGithub(false);
        },
      },
    });
  };

  const handleAuthWithPassword = form.handleSubmit(async (credentials) => {
    if (type === "register") {
      const emailPrefix = credentials.email.split("@")[0];
      await authClient.signUp.email({
        email: credentials.email,
        password: credentials.password,
        name: emailPrefix ?? "User",
        fetchOptions: {
          onSuccess: () => {
            router.replace(params.nextPath ?? "/dashboard");
          },
          onError: (ctx) => {
            toast.error(ctx.error.message);
          },
        },
      });
    }

    if (type === "login") {
      await authClient.signIn.email({
        email: credentials.email,
        password: credentials.password,
        fetchOptions: {
          onSuccess: () => {
            router.replace(params.nextPath ?? "/dashboard");
          },
          onError: (ctx) => {
            toast.error(ctx.error.message);
          },
        },
      });
    }
  });

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <Button
        variant="outline"
        type="button"
        loading={submittingGithub}
        onClick={handleAuthWithGithub}
      >
        Continue with Github
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">Or</span>
        </div>
      </div>
      <form className="grid gap-2" onSubmit={handleAuthWithPassword}>
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
        <Field>
          <FieldLabel className="sr-only" htmlFor="password">
            Password
          </FieldLabel>
          <Input
            id="password"
            data-test="password-input"
            required
            type="password"
            placeholder="******"
            autoCapitalize="none"
            autoComplete="current-password"
            autoCorrect="off"
            aria-invalid={errors.password ? true : undefined}
            {...register("password")}
          />
          <FieldError errors={errors.password ? [errors.password] : undefined} />
        </Field>
        <Button loading={isSubmitting}>{type === "login" ? "Login" : "Register"}</Button>
      </form>
    </div>
  );
};

export const RequestPasswordResetForm = () => {
  const form = useForm({
    resolver: zodResolver(
      z.object({
        email: z.email("Invalid email address"),
      }),
    ),
    defaultValues: {
      email: "",
    },
  });

  const {
    register,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = form;

  const handlePasswordReset = form.handleSubmit(async (data) => {
    await authClient.requestPasswordReset({
      email: data.email,
      fetchOptions: {
        onSuccess: () => {
          toast.success("Password reset email sent successfully!");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
      },
    });
  });

  if (isSubmitSuccessful) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
          <p className="text-sm text-green-800 dark:text-green-200">
            Password reset email sent! Check your inbox and follow the instructions to reset your
            password.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={handlePasswordReset}>
      <Field>
        <FieldLabel className="sr-only" htmlFor="reset-email">
          Email
        </FieldLabel>
        <Input
          id="reset-email"
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
      <Button loading={isSubmitting}>Request Password Reset</Button>
    </form>
  );
};

export const UpdatePasswordForm = () => {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(
      z
        .object({
          password: z.string().min(8, "Password must be at least 8 characters"),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: "Passwords don't match",
          path: ["confirmPassword"],
        }),
    ),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  const handleUpdatePassword = form.handleSubmit(async (data) => {
    await authClient.resetPassword({
      newPassword: data.password,
      fetchOptions: {
        onSuccess: () => {
          toast.success("Password updated successfully!");
          router.push("/dashboard");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
      },
    });
  });

  return (
    <form className="grid gap-4" onSubmit={handleUpdatePassword}>
      <Field>
        <FieldLabel className="sr-only" htmlFor="new-password">
          New Password
        </FieldLabel>
        <Input
          id="new-password"
          required
          type="password"
          placeholder="Enter new password"
          autoCapitalize="none"
          autoComplete="new-password"
          autoCorrect="off"
          aria-invalid={errors.password ? true : undefined}
          {...register("password")}
        />
        <FieldError errors={errors.password ? [errors.password] : undefined} />
      </Field>
      <Field>
        <FieldLabel className="sr-only" htmlFor="confirm-password">
          Confirm New Password
        </FieldLabel>
        <Input
          id="confirm-password"
          required
          type="password"
          placeholder="Confirm new password"
          autoCapitalize="none"
          autoComplete="new-password"
          autoCorrect="off"
          aria-invalid={errors.confirmPassword ? true : undefined}
          {...register("confirmPassword")}
        />
        <FieldError errors={errors.confirmPassword ? [errors.confirmPassword] : undefined} />
      </Field>
      <Button loading={isSubmitting}>Update Password</Button>
    </form>
  );
};
