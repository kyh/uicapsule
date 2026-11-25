import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { AuthForm, AuthSwitchLink } from "@/app/(main)/(auth)/_components/auth-form";

export const metadata: Metadata = {
  title: "Login",
};

const Page = () => (
  <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
    <div className="flex flex-col text-center">
      <h1 className="text-lg font-light">Welcome back</h1>
    </div>
    <AuthForm type="login" />
    <Link href="/auth/password-reset" className="text-center text-sm underline">
      Forgot password?
    </Link>
    <p className="text-muted-foreground px-8 text-center text-sm">
      Don&apos;t have an account?{" "}
      <Suspense
        fallback={
          <Link href="/auth/register" className="underline">
            Register
          </Link>
        }
      >
        <AuthSwitchLink href="/auth/register">Register</AuthSwitchLink>
      </Suspense>
    </p>
  </div>
);

export default Page;
