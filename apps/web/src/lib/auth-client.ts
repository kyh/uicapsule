import { oauthProviderClient } from "@better-auth/oauth-provider/client";
import { emailOTPClient, usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [emailOTPClient(), usernameClient(), oauthProviderClient()],
});
