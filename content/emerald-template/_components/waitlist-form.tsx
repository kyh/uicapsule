"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/sonner";
import { cn } from "@repo/ui/lib/utils";

export const WaitlistForm = () => {
  const [email, setEmail] = useState("");

  const handleJoinWaitlist = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;
    toast.success("Waitlist joined!");
    setEmail("");
  };

  return (
    <form
      className="border-border flex max-w-sm items-center gap-2 rounded-full border shadow-lg"
      onSubmit={handleJoinWaitlist}
    >
      <label htmlFor="waitlist-email" className="sr-only">
        Email
      </label>
      <input
        id="waitlist-email"
        className="w-full min-w-0 flex-1 border-none bg-transparent py-2 pl-4 text-sm placeholder-white/50 focus:placeholder-white/75 focus:ring-0 focus:outline-hidden"
        required
        type="email"
        placeholder="name@example.com"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect="off"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Button className={cn("text-xs hover:bg-transparent")} variant="ghost">
        Join Waitlist
      </Button>
    </form>
  );
};
