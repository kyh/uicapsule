"use client";

import React from "react";
import { Button } from "@repo/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/form";
import { toast } from "@repo/ui/toast";
import { cn } from "@repo/ui/utils";
import { useForm } from "react-hook-form";

export const WaitlistForm = () => {
  const form = useForm({
    defaultValues: {
      email: "",
    },
  });

  const handleJoinWaitlist = form.handleSubmit((values) => {
    toast.success("Waitlist joined!");
  });

  return (
    <Form {...form}>
      <form
        className="border-border flex max-w-sm items-center gap-2 rounded-full border shadow-lg"
        onSubmit={handleJoinWaitlist}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="min-w-0 flex-1 space-y-0">
              <FormLabel className="sr-only">Email</FormLabel>
              <FormControl>
                <input
                  className="w-full border-none bg-transparent py-2 pl-4 text-sm placeholder-white/50 focus:placeholder-white/75 focus:ring-0 focus:outline-hidden"
                  required
                  type="email"
                  placeholder="name@example.com"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage className="absolute pt-1" />
            </FormItem>
          )}
        />
        <Button className={cn("text-xs hover:bg-transparent")} variant="ghost">
          Join Waitlist
        </Button>
      </form>
    </Form>
  );
};
