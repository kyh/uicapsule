import { Suspense } from "react";
import { headers } from "next/headers";
import { getSessionCookie } from "better-auth/cookies";

import { ProfileButton } from "@/components/profile-button";

// Cookie presence only decides whether to ask for the session; the session itself is still
// validated by /api/auth on the client.
const SessionAwareProfileButton = async () => {
  const signedIn = getSessionCookie(await headers()) !== null;
  return <ProfileButton signedIn={signedIn} />;
};

export const ProfileSlot = () => (
  <Suspense fallback={<ProfileButton signedIn={false} />}>
    <SessionAwareProfileButton />
  </Suspense>
);
