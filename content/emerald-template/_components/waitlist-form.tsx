"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "./ui";

export const WaitlistForm = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleJoinWaitlist = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) {
      return;
    }
    setSubmitted(true);
    setEmail("");
  };

  return (
    <form
      className="border-(--border) relative flex max-w-sm items-center gap-2 rounded-full border shadow-lg"
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
        onChange={(event) => {
          setEmail(event.target.value);
          setSubmitted(false);
        }}
      />
      <Button type="submit" className="text-xs hover:bg-transparent">
        Join Waitlist
      </Button>
      <output className="absolute top-full left-4 mt-2 text-xs text-emerald-400">
        {submitted ? "Waitlist joined!" : ""}
      </output>
    </form>
  );
};
