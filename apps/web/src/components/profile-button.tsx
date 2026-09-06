"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BookCheckIcon,
  LogInIcon,
  LogOutIcon,
  MoonIcon,
  StarsIcon,
  SunIcon,
  SunMoonIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Button } from "@repo/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/components/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Tabs, TabsIndicator, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { useMediaQuery } from "@repo/ui/hooks/use-media-query";
import { cn } from "@repo/ui/lib/utils";
import { authClient } from "@/lib/auth-client";

const menuItemIconClassName = "text-muted-foreground size-4 group-hover:text-foreground transition";
const themes = [
  { value: "system", label: "System theme", icon: SunMoonIcon },
  { value: "light", label: "Light theme", icon: SunIcon },
  { value: "dark", label: "Dark theme", icon: MoonIcon },
];

export const ProfileButton = () => {
  const isDesktop = useMediaQuery();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const handleSignOut = () => {
    void authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          close();
          router.refresh();
        },
      },
    });
  };

  const avatar = (
    <Avatar className="size-8">
      {user?.image && <AvatarImage src={user.image} alt="" />}
      <AvatarFallback>
        {user ? (user.name || user.email).slice(0, 2).toUpperCase() : "UI"}
      </AvatarFallback>
    </Avatar>
  );

  const menu = (
    <>
      {user && (
        <>
          <div className="flex flex-col px-2 py-1.5 text-sm">
            <span className="truncate">{user.name}</span>
            <span className="text-muted-foreground truncate text-xs">{user.email}</span>
          </div>
          <DropdownMenuSeparator />
        </>
      )}
      <ProfileLink isDesktop={isDesktop} href="/about" onClick={close}>
        <BookCheckIcon aria-hidden="true" className={menuItemIconClassName} />
        About
      </ProfileLink>
      <ProfileLink isDesktop={isDesktop} href="/inspiration" onClick={close}>
        <StarsIcon aria-hidden="true" className={menuItemIconClassName} />
        Inspiration
      </ProfileLink>
      <DropdownMenuSeparator />
      <ProfileLink
        isDesktop={isDesktop}
        href="https://github.com/kyh/uicapsule"
        target="_blank"
        onClick={close}
      >
        <svg
          aria-hidden="true"
          className={menuItemIconClassName}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
        GitHub
      </ProfileLink>
      <ProfileLink
        isDesktop={isDesktop}
        href="https://x.com/kaiyuhsu"
        target="_blank"
        onClick={close}
      >
        <svg
          aria-hidden="true"
          className={menuItemIconClassName}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Twitter
      </ProfileLink>
      <DropdownMenuSeparator />
      <div className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm">
        <span className="flex-1">Theme</span>
        <Tabs value={theme ?? "system"} onValueChange={setTheme}>
          <TabsList className="bg-background relative flex h-fit items-center gap-0.5 rounded-full border p-0 *:[[role=tab]]:size-6">
            <TabsIndicator className="rounded-full bg-accent" />
            {themes.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="text-muted-foreground data-active:text-foreground relative inline-flex h-[28px] items-center justify-center gap-1.5 rounded-full px-2 has-[>svg]:pl-1.5 [&>svg]:pointer-events-none"
                aria-label={label}
              >
                <div>
                  <Icon className="size-3 shrink-0" />
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <DropdownMenuSeparator />
      {user ? (
        isDesktop ? (
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOutIcon aria-hidden="true" className={menuItemIconClassName} />
            Sign out
          </DropdownMenuItem>
        ) : (
          <button
            type="button"
            className="group flex w-full items-center gap-2 px-2 py-1.5 text-sm"
            onClick={handleSignOut}
          >
            <LogOutIcon aria-hidden="true" className={menuItemIconClassName} />
            Sign out
          </button>
        )
      ) : (
        <ProfileLink isDesktop={isDesktop} href="/auth/login" onClick={close}>
          <LogInIcon aria-hidden="true" className={menuItemIconClassName} />
          Login
        </ProfileLink>
      )}
    </>
  );

  if (isDesktop) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger aria-label="Settings" render={<Button variant="ghost" size="icon" />}>
          {avatar}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40" align="end">
          {menu}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings">
          {avatar}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>Settings</DrawerTitle>
          <DrawerDescription>Settings options</DrawerDescription>
        </DrawerHeader>
        {menu}
      </DrawerContent>
    </Drawer>
  );
};

const ProfileLink = ({
  isDesktop,
  children,
  className,
  ...props
}: ComponentProps<typeof Link> & {
  isDesktop: boolean;
  children: ReactNode;
}) =>
  isDesktop ? (
    <DropdownMenuItem
      render={<Link {...props} />}
      className={cn("group w-full justify-start", className)}
    >
      {children}
    </DropdownMenuItem>
  ) : (
    <Link
      {...props}
      className={cn("group flex w-full items-center gap-2 px-2 py-1.5 text-sm", className)}
    >
      {children}
    </Link>
  );
