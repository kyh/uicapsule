import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  id: text("id").primaryKey(),
  image: text("image"),
  name: text("name").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
  username: text("username").unique(),
});

export const session = sqliteTable(
  "session",
  {
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    id: text("id").primaryKey(),
    ipAddress: text("ip_address"),
    token: text("token").notNull().unique(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    accessToken: text("access_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    accountId: text("account_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    id: text("id").primaryKey(),
    idToken: text("id_token"),
    password: text("password"),
    providerId: text("provider_id").notNull(),
    refreshToken: text("refresh_token"),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
    value: text("value").notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const rateLimit = sqliteTable("rate_limit", {
  count: integer("count").notNull(),
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  lastRequest: integer("last_request").notNull(),
});

export const jwks = sqliteTable("jwks", {
  alg: text("alg"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  crv: text("crv"),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
  id: text("id").primaryKey(),
  privateKey: text("private_key").notNull(),
  publicKey: text("public_key").notNull(),
});

export const oauthClient = sqliteTable(
  "oauth_client",
  {
    applicationType: text("application_type"),
    backchannelLogoutSessionRequired: integer("backchannel_logout_session_required", {
      mode: "boolean",
    }),
    backchannelLogoutUri: text("backchannel_logout_uri"),
    clientCredentialsScopes: text("client_credentials_scopes"),
    clientDiscoveryId: text("client_discovery_id"),
    clientId: text("client_id").notNull().unique(),
    clientSecret: text("client_secret"),
    contacts: text("contacts"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }),
    disabled: integer("disabled", { mode: "boolean" }),
    dpopBoundAccessTokens: integer("dpop_bound_access_tokens", { mode: "boolean" }),
    enableEndSession: integer("enable_end_session", { mode: "boolean" }),
    grantTypes: text("grant_types"),
    icon: text("icon"),
    id: text("id").primaryKey(),
    jwks: text("jwks"),
    jwksUri: text("jwks_uri"),
    metadata: text("metadata"),
    name: text("name"),
    policy: text("policy"),
    postLogoutRedirectUris: text("post_logout_redirect_uris"),
    redirectUris: text("redirect_uris").notNull(),
    referenceId: text("reference_id"),
    requirePKCE: integer("require_pkce", { mode: "boolean" }),
    responseTypes: text("response_types"),
    scopes: text("scopes"),
    skipConsent: integer("skip_consent", { mode: "boolean" }),
    softwareId: text("software_id"),
    softwareStatement: text("software_statement"),
    softwareVersion: text("software_version"),
    subjectType: text("subject_type"),
    tokenEndpointAuthMethod: text("token_endpoint_auth_method"),
    tos: text("tos"),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
    uri: text("uri"),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("oauth_client_userId_idx").on(table.userId)],
);

export const oauthResource = sqliteTable("oauth_resource", {
  accessTokenTtl: integer("access_token_ttl"),
  allowedScopes: text("allowed_scopes"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }),
  customClaims: text("custom_claims"),
  disabled: integer("disabled", { mode: "boolean" }),
  dpopBoundAccessTokensRequired: integer("dpop_bound_access_tokens_required", { mode: "boolean" }),
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull().unique(),
  metadata: text("metadata"),
  name: text("name").notNull(),
  policyVersion: integer("policy_version"),
  refreshTokenTtl: integer("refresh_token_ttl"),
  signingAlgorithm: text("signing_algorithm"),
  signingKeyId: text("signing_key_id"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
});

export const oauthClientResource = sqliteTable(
  "oauth_client_resource",
  {
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }),
    id: text("id").primaryKey(),
    metadata: text("metadata"),
    resourceId: text("resource_id")
      .notNull()
      .references(() => oauthResource.identifier, { onDelete: "cascade" }),
  },
  (table) => [
    index("oauth_client_resource_clientId_idx").on(table.clientId),
    index("oauth_client_resource_resourceId_idx").on(table.resourceId),
  ],
);

export const oauthRefreshToken = sqliteTable(
  "oauth_refresh_token",
  {
    authorizationCodeId: text("authorization_code_id"),
    authTime: integer("auth_time", { mode: "timestamp_ms" }),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
    confirmation: text("confirmation"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    id: text("id").primaryKey(),
    referenceId: text("reference_id"),
    requestedUserInfoClaims: text("requested_user_info_claims"),
    resources: text("resources"),
    revoked: integer("revoked", { mode: "timestamp_ms" }),
    rotatedAt: integer("rotated_at", { mode: "timestamp_ms" }),
    rotationReplayExpiresAt: integer("rotation_replay_expires_at", { mode: "timestamp_ms" }),
    rotationReplayResponse: text("rotation_replay_response"),
    scopes: text("scopes").notNull(),
    sessionId: text("session_id").references(() => session.id, { onDelete: "set null" }),
    token: text("token").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("oauth_refresh_token_authorizationCodeId_idx").on(table.authorizationCodeId),
    index("oauth_refresh_token_clientId_idx").on(table.clientId),
    index("oauth_refresh_token_sessionId_idx").on(table.sessionId),
    index("oauth_refresh_token_userId_idx").on(table.userId),
  ],
);

export const oauthAccessToken = sqliteTable(
  "oauth_access_token",
  {
    authorizationCodeId: text("authorization_code_id"),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
    confirmation: text("confirmation"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    id: text("id").primaryKey(),
    referenceId: text("reference_id"),
    refreshId: text("refresh_id").references(() => oauthRefreshToken.id, { onDelete: "cascade" }),
    requestedUserInfoClaims: text("requested_user_info_claims"),
    resources: text("resources"),
    revoked: integer("revoked", { mode: "timestamp_ms" }),
    scopes: text("scopes").notNull(),
    sessionId: text("session_id").references(() => session.id, { onDelete: "set null" }),
    token: text("token").unique(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("oauth_access_token_authorizationCodeId_idx").on(table.authorizationCodeId),
    index("oauth_access_token_clientId_idx").on(table.clientId),
    index("oauth_access_token_refreshId_idx").on(table.refreshId),
    index("oauth_access_token_sessionId_idx").on(table.sessionId),
    index("oauth_access_token_userId_idx").on(table.userId),
  ],
);

export const oauthConsent = sqliteTable(
  "oauth_consent",
  {
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }),
    id: text("id").primaryKey(),
    referenceId: text("reference_id"),
    requestedUserInfoClaims: text("requested_user_info_claims"),
    resources: text("resources"),
    scopes: text("scopes").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("oauth_consent_clientId_idx").on(table.clientId),
    index("oauth_consent_userId_idx").on(table.userId),
  ],
);

export const oauthClientAssertion = sqliteTable("oauth_client_assertion", {
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  id: text("id").primaryKey(),
});
