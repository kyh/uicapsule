"use client";

import { createContext, use, useCallback, useMemo, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BookCheckIcon,
  LightbulbIcon,
  LogInIcon,
  LogOutIcon,
  MoonIcon,
  PlugIcon,
  PuzzleIcon,
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
import { DropdownMenuSeparator } from "@repo/ui/components/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPopup,
  NavigationMenuPortal,
  NavigationMenuPositioner,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@repo/ui/components/navigation-menu";
import { Tabs, TabsIndicator, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { cn } from "cn";
import { authClient } from "@/lib/auth-client";

const menuItemIconClassName = "text-muted-foreground size-4 group-hover:text-foreground transition";

const themes = [
  { icon: SunMoonIcon, label: "System theme", value: "system" },
  { icon: SunIcon, label: "Light theme", value: "light" },
  { icon: MoonIcon, label: "Dark theme", value: "dark" },
];

type MenuVariant = "nav" | "drawer";

const ProfileMenuContext = createContext<{
  variant: MenuVariant;
  close: () => void;
} | null>(null);

const ProfileMenuProvider = ({
  variant,
  close,
  children,
}: {
  variant: MenuVariant;
  close: () => void;
  children: ReactNode;
}) => {
  const value = useMemo(() => ({ close, variant }), [close, variant]);

  return <ProfileMenuContext value={value}>{children}</ProfileMenuContext>;
};

const useProfileMenu = () => {
  const context = use(ProfileMenuContext);

  if (!context) {
    throw new Error("Profile menu items must render inside a ProfileMenuProvider.");
  }

  return context;
};

const itemClassName = (variant: MenuVariant) =>
  cn(
    "group flex w-full items-center gap-2 px-2 py-1.5 text-sm",
    variant === "nav" &&
      "rounded-sm outline-none select-none hover:bg-muted focus-visible:bg-muted",
  );

const ProfileLink = ({ children, className, ...props }: ComponentProps<typeof Link>) => {
  const { variant, close } = useProfileMenu();

  return variant === "nav" ? (
    <NavigationMenuLink
      closeOnClick
      render={<Link {...props} />}
      className={cn(itemClassName(variant), className)}
    >
      {children}
    </NavigationMenuLink>
  ) : (
    <Link {...props} onClick={close} className={cn(itemClassName(variant), className)}>
      {children}
    </Link>
  );
};

const ProfileAction = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => {
  const { variant, close } = useProfileMenu();

  return (
    <button
      type="button"
      className={itemClassName(variant)}
      onClick={() => {
        close();
        onClick();
      }}
    >
      {children}
    </button>
  );
};

type SessionUser = NonNullable<ReturnType<typeof authClient.useSession>["data"]>["user"];

const ProfileMenuItems = ({ user, onSignOut }: { user?: SessionUser; onSignOut: () => void }) => {
  const { theme, setTheme } = useTheme();

  return (
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
      <ProfileLink href="/about">
        <BookCheckIcon aria-hidden="true" className={menuItemIconClassName} />
        About
      </ProfileLink>
      <ProfileLink href="/request">
        <LightbulbIcon aria-hidden="true" className={menuItemIconClassName} />
        Request
      </ProfileLink>
      <ProfileLink href="/install/mcp">
        <PlugIcon aria-hidden="true" className={menuItemIconClassName} />
        Install MCP
      </ProfileLink>
      <ProfileLink href="/install/extension">
        <PuzzleIcon aria-hidden="true" className={menuItemIconClassName} />
        Extension
      </ProfileLink>
      <DropdownMenuSeparator />
      <ProfileLink href="https://github.com/kyh/uicapsule" target="_blank">
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
      <ProfileLink href="https://x.com/kaiyuhsu" target="_blank">
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
        <ProfileAction onClick={onSignOut}>
          <LogOutIcon aria-hidden="true" className={menuItemIconClassName} />
          Sign out
        </ProfileAction>
      ) : (
        <ProfileLink href="/auth/login">
          <LogInIcon aria-hidden="true" className={menuItemIconClassName} />
          Login
        </ProfileLink>
      )}
    </>
  );
};

const ProfileMenu = ({ user }: { user?: SessionUser }) => {
  const router = useRouter();
  const [navValue, setNavValue] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeNav = useCallback(() => {
    setNavValue(null);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const handleSignOut = () => {
    void authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.refresh();
        },
      },
    });
  };

  const avatar = (
    <Avatar className="size-8">
      {user !== undefined &&
        user.image !== undefined &&
        user.image !== null &&
        user.image !== "" && <AvatarImage src={user.image} alt="" />}
      <AvatarFallback>
        {user ? (user.name || user.email).slice(0, 2).toUpperCase() : "UI"}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <>
      <NavigationMenu
        className="max-sm:hidden"
        value={navValue}
        onValueChange={(value) => {
          setNavValue(value);
        }}
      >
        <NavigationMenuList render={<div />}>
          <NavigationMenuItem value="profile" render={<div />}>
            <NavigationMenuTrigger
              aria-label="Settings"
              render={<Button variant="ghost" size="icon" />}
            >
              {avatar}
            </NavigationMenuTrigger>
            <NavigationMenuContent className="w-40 p-1">
              <ProfileMenuProvider variant="nav" close={closeNav}>
                <ProfileMenuItems user={user} onSignOut={handleSignOut} />
              </ProfileMenuProvider>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
        <NavigationMenuPortal>
          <NavigationMenuPositioner align="end">
            <NavigationMenuPopup>
              <NavigationMenuViewport />
            </NavigationMenuPopup>
          </NavigationMenuPositioner>
        </NavigationMenuPortal>
      </NavigationMenu>
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger
          aria-label="Settings"
          render={<Button variant="ghost" size="icon" className="sm:hidden" />}
        >
          {avatar}
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="sr-only">
            <DrawerTitle>Settings</DrawerTitle>
            <DrawerDescription>Settings options</DrawerDescription>
          </DrawerHeader>
          <ProfileMenuProvider variant="drawer" close={closeDrawer}>
            <ProfileMenuItems user={user} onSignOut={handleSignOut} />
          </ProfileMenuProvider>
        </DrawerContent>
      </Drawer>
    </>
  );
};

const SignedInProfileMenu = () => {
  const { data: session } = authClient.useSession();

  return <ProfileMenu user={session?.user} />;
};

export const ProfileButton = ({ signedIn }: { signedIn: boolean }) =>
  signedIn ? <SignedInProfileMenu /> : <ProfileMenu />;
