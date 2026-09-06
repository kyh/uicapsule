import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { UpdatePasswordForm } from "@/app/(main)/(auth)/_components/auth-form";

export const metadata: Metadata = { title: "Update Password" };

type PageProps = {
  searchParams: Promise<{ token?: string | string[]; error?: string | string[] }>;
};

const PasswordUpdate = async ({ searchParams }: PageProps) => {
  const { token, error } = await searchParams;
  if (!token || Array.isArray(token) || error) {
    return (
      <div className="space-y-4 text-center">
        <p>This password reset link is missing or expired.</p>
        <Link href="/auth/password-reset" className="underline">
          Request a new link
        </Link>
      </div>
    );
  }
  return <UpdatePasswordForm token={token} />;
};

const Page = (props: PageProps) => (
  <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
    <h1 className="text-center text-lg font-light">Update your password</h1>
    <Suspense fallback={<p>Loading…</p>}>
      <PasswordUpdate {...props} />
    </Suspense>
  </div>
);

export default Page;
