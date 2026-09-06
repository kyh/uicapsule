"use client";

import { useState, type HTMLAttributes } from "react";
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

const emailSchema = z.object({ email: z.email("Invalid email address") });
const loginSchema = emailSchema.extend({ password: z.string().min(1, "Password is required") });
const registerSchema = emailSchema.extend({ password: z.string().min(8).max(128) });
const passwordSchema = z
  .object({ password: z.string().min(8).max(128), confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type AuthFormProps = {
  type: "login" | "register";
} & HTMLAttributes<HTMLDivElement>;

export const AuthForm = ({ className, type, ...props }: AuthFormProps) => {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(type === "register" ? registerSchema : loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  const handleAuthWithPassword = form.handleSubmit(async (credentials) => {
    try {
      const result =
        type === "register"
          ? await authClient.signUp.email({
              ...credentials,
              name: credentials.email.split("@")[0] ?? "User",
            })
          : await authClient.signIn.email(credentials);
      if (result.error) {
        form.setError("root", { message: result.error.message ?? "Unable to sign in. Try again." });
        return;
      }
      router.replace("/");
    } catch {
      form.setError("root", { message: "Unable to connect. Try again." });
    }
  });

  return (
    <div className={cn("grid gap-6", className)} {...props}>
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
            autoComplete={type === "register" ? "new-password" : "current-password"}
            autoCorrect="off"
            aria-invalid={errors.password ? true : undefined}
            {...register("password")}
          />
          <FieldError errors={errors.password ? [errors.password] : undefined} />
        </Field>
        <FieldError errors={errors.root ? [errors.root] : undefined} />
        <Button type="submit" loading={isSubmitting}>
          {type === "login" ? "Login" : "Register"}
        </Button>
      </form>
    </div>
  );
};

export const RequestPasswordResetForm = () => {
  const [requested, setRequested] = useState(false);
  const form = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  const {
    register,
    formState: { errors, isSubmitting },
  } = form;

  const handlePasswordReset = form.handleSubmit(async (data) => {
    try {
      const { error } = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: "/auth/password-update",
      });
      if (error) {
        form.setError("root", {
          message:
            error.code === "RESET_PASSWORD_DISABLED"
              ? "Password reset is temporarily unavailable. Try again later."
              : (error.message ?? "Unable to request a reset. Try again."),
        });
        return;
      }
      setRequested(true);
    } catch {
      form.setError("root", { message: "Unable to connect. Try again." });
    }
  });

  if (requested) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
          <p className="text-sm text-green-800 dark:text-green-200">
            If an account exists for that email, you'll receive a password reset link.
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
      <FieldError errors={errors.root ? [errors.root] : undefined} />
      <Button type="submit" loading={isSubmitting}>
        Request Password Reset
      </Button>
    </form>
  );
};

export const UpdatePasswordForm = ({ token }: { token: string }) => {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(passwordSchema),
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
    try {
      const { error } = await authClient.resetPassword({ token, newPassword: data.password });
      if (error) {
        form.setError("root", {
          message: error.message ?? "Unable to reset your password. Try again.",
        });
        return;
      }
      toast.success("Password updated. Sign in with your new password.");
      router.replace("/auth/login");
    } catch {
      form.setError("root", { message: "Unable to connect. Try again." });
    }
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
      <FieldError errors={errors.root ? [errors.root] : undefined} />
      <Button type="submit" loading={isSubmitting}>
        Update Password
      </Button>
    </form>
  );
};
