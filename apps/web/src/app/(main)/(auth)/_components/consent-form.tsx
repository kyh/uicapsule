"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { FieldError } from "@repo/ui/components/field";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";

const continuationSchema = z.object({ url: z.string() });

const clientSchema = z.object({ client_name: z.string().optional() });

export const ConsentForm = () => {
  const params = useSearchParams();
  const clientId = params.get("client_id") ?? "";
  const { data: session } = authClient.useSession();
  const [clientName, setClientName] = useState<string | null>(null);
  const [pending, setPending] = useState<"allow" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) {
      return;
    }

    const load = async () => {
      try {
        const { data } = await authClient.oauth2.publicClient({ query: { client_id: clientId } });
        setClientName(clientSchema.safeParse(data).data?.client_name ?? null);
      } catch {
        setClientName(null);
      }
    };

    void load();
  }, [clientId]);

  const answer = async (accept: boolean) => {
    setPending(accept ? "allow" : "deny");
    setError(null);

    const result = await authClient.oauth2.consent({ accept }).catch(() => null);
    const next = continuationSchema.safeParse(result?.data);

    if (next.success) {
      window.location.assign(next.data.url);

      return;
    }

    setPending(null);
    setError(result?.error?.message ?? "Unable to answer. Start the sign-in again from the app.");
  };

  const app = clientName ?? "An app";

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-lg font-light">Allow {app} to publish for you?</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          {app} will be able to publish components to
          {session?.user.username !== undefined &&
          session.user.username !== null &&
          session.user.username !== ""
            ? ` @${session.user.username}`
            : " your account"}{" "}
          and list the ones you have published. It cannot read your email or password.
        </p>
      </div>
      <FieldError errors={error !== null && error !== "" ? [{ message: error }] : undefined} />
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          loading={pending === "deny"}
          disabled={pending !== null}
          onClick={() => {
            void answer(false);
          }}
        >
          Deny
        </Button>
        <Button
          loading={pending === "allow"}
          disabled={pending !== null}
          onClick={() => {
            void answer(true);
          }}
        >
          Allow
        </Button>
      </div>
    </div>
  );
};
