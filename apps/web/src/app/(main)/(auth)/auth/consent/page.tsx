import { Suspense } from "react";
import type { Metadata } from "next";

import { ConsentForm } from "@/app/(main)/(auth)/_components/consent-form";

export const metadata: Metadata = {
  title: "Allow access",
};

const Page = () => (
  <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
    <Suspense>
      <ConsentForm />
    </Suspense>
  </div>
);

export default Page;
