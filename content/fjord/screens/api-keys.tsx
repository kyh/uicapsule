import { useEffect, useRef, useState } from "react";
import { Ellipsis, Plus } from "lucide-react";

import { Avatar } from "../components/avatar";
import { Badge, CodeTag } from "../components/badge";
import { Button } from "../components/button";
import { CopyButton } from "../components/copy-button";
import { Collapsible, RelativeTime } from "../components/data";
import { EmptyState } from "../components/feedback";
import { TextField } from "../components/field";
import { Card, CardHead } from "../components/frame";
import { Icon } from "../components/icon";
import { Dialog, Menu, Select } from "../components/overlays";
import { ChoiceList, Segmented } from "../components/selection";
import { useToast } from "../components/toast";
import { PageHeader, Screen } from "./screen";

type Scope = "read" | "write" | "admin";

type Env = "Production" | "Staging";

type Expiry = "30d" | "90d" | "never";

interface ApiKey {
  id: string;
  name: string;
  env: Env;
  scope: Scope;
  tail: string;
  owner: string;
  usedAgo: number | null;
  expires: Expiry;
  secret?: string;
  revoked?: boolean;
}

const SCOPE_WORD = { admin: "Admin", read: "Read only", write: "Deploy" } satisfies Record<
  Scope,
  string
>;

const SCOPES = [
  {
    description: "Reads runs and traces and starts nothing.",
    label: "Read only",
    value: "read",
  },
  {
    description: "Starts runs and posts check results. What a pipeline needs.",
    label: "Deploy",
    value: "write",
  },
  {
    description: "Also mints and burns other keys. Hand it to a person, never a pipeline.",
    label: "Admin",
    value: "admin",
  },
] as const;

const EXPIRY = [
  { label: "In 30 days", value: "30d" },
  { label: "In 90 days", value: "90d" },
  { label: "Never", value: "never" },
] as const;

const EXPIRY_WORD = {
  "30d": "expires in 30 days",
  "90d": "expires in 90 days",
  never: "never expires",
} satisfies Record<Expiry, string>;

const ENVS = ["Production", "Staging"] as const;

const SEED: ApiKey[] = [
  {
    env: "Production",
    id: "key_01",
    name: "deploy-vercel",
    owner: "Idris Okafor",
    scope: "write",
    expires: "90d",
    tail: "8c2f",
    usedAgo: 220,
  },
  {
    env: "Production",
    id: "key_02",
    name: "status-probe",
    owner: "Maren Holt",
    scope: "read",
    expires: "never",
    tail: "41aa",
    usedAgo: 5400,
  },
  {
    env: "Production",
    id: "key_03",
    name: "pager-hook",
    owner: "Sunniva Brekke",
    scope: "write",
    expires: "30d",
    tail: "e907",
    usedAgo: 1_036_800,
  },
  {
    env: "Staging",
    id: "key_04",
    name: "soak-test",
    owner: "Tomasz Wierzba",
    scope: "admin",
    expires: "30d",
    tail: "53d0",
    usedAgo: null,
  },
  {
    env: "Production",
    id: "key_00",
    name: "deploy-legacy",
    owner: "Maren Holt",
    revoked: true,
    scope: "admin",
    expires: "90d",
    tail: "a1b7",
    usedAgo: 6_048_000,
  },
];

const PREFIX = { Production: "kd_prod_", Staging: "kd_stage_" } satisfies Record<Env, string>;

const makeSecret = () => {
  const bytes = new Uint8Array(18);

  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const KeyRow = ({
  apiKey,
  onRevoke,
  onDone,
}: {
  apiKey: ApiKey;
  onRevoke: (key: ApiKey) => void;
  onDone: (key: ApiKey) => void;
}) => {
  const toast = useToast();

  const full =
    apiKey.secret !== undefined && apiKey.secret !== ""
      ? `${PREFIX[apiKey.env]}${apiKey.secret}`
      : null;

  return (
    <div className="fj-keyrow" data-fresh={full !== null && full !== "" ? "" : undefined}>
      <div className="fj-item-main">
        <span className="fj-item-title">
          <span className="fj-truncate">{apiKey.name}</span>
          <Badge kind={apiKey.scope === "admin" ? "secret" : undefined}>
            {SCOPE_WORD[apiKey.scope]}
          </Badge>
        </span>
        <span className="fj-item-desc fj-hstack">
          <Avatar name={apiKey.owner} size="sm" />
          <span>
            {apiKey.owner},{" "}
            {full !== null && full !== ""
              ? `in full this once, ${EXPIRY_WORD[apiKey.expires]}`
              : null}
            {(full === null || full === "") && apiKey.usedAgo === null
              ? `never used, ${EXPIRY_WORD[apiKey.expires]}`
              : null}
            {(full === null || full === "") && apiKey.usedAgo !== null ? (
              <>
                used <RelativeTime secondsAgo={apiKey.usedAgo} />, {EXPIRY_WORD[apiKey.expires]}
              </>
            ) : null}
          </span>
        </span>
      </div>
      <CodeTag>
        {PREFIX[apiKey.env]}
        ••••
        {apiKey.tail}
      </CodeTag>
      {apiKey.revoked === true ? (
        <span className="fj-status" data-status="idle">
          Burned
        </span>
      ) : (
        <Menu
          align="end"
          items={[
            {
              label: "Copy key ID",
              onSelect: () => {
                void navigator.clipboard?.writeText(apiKey.id).catch(() => null);
                toast({ title: `Copied ${apiKey.id}` });
              },
            },
            {
              label: "Rename",
              onSelect: () =>
                toast({
                  description: "A name is only a label. The key itself does not change.",
                  title: `Renaming ${apiKey.name}`,
                }),
            },
            {
              destructive: true,
              label: "Burn key",
              onSelect: () => {
                onRevoke(apiKey);
              },
            },
          ]}
          label={`Actions for ${apiKey.name}`}
          renderTrigger={({ open, toggle, id }) => (
            <Button
              aria-controls={open ? id : undefined}
              aria-expanded={open}
              aria-haspopup="menu"
              aria-label={`Actions for ${apiKey.name}`}
              onClick={toggle}
              size="icon-sm"
              variant="ghost"
            >
              <Icon icon={Ellipsis} />
            </Button>
          )}
        />
      )}
      {full !== null && full !== "" ? (
        <div className="fj-keyrow-secret">
          <code>{full}</code>
          <CopyButton label="Copy key" showLabel value={full} />
          <Button
            onClick={() => {
              onDone(apiKey);
            }}
            size="sm"
            variant="ghost"
          >
            Hide it now
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export const ApiKeys = () => {
  const [keys, setKeys] = useState(SEED);
  const [env, setEnv] = useState<Env>("Production");
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<ApiKey | null>(null);
  const [name, setName] = useState("preview-deploys");
  const [scope, setScope] = useState<Scope>("write");
  const [expiry, setExpiry] = useState<Expiry>("90d");
  const [touched, setTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const mintTimer = useRef<number | null>(null);
  const toast = useToast();

  const cancelMint = () => {
    if (mintTimer.current !== null) {
      window.clearTimeout(mintTimer.current);
      mintTimer.current = null;
    }

    setPending(false);
  };

  useEffect(
    () => () => {
      if (mintTimer.current !== null) {
        window.clearTimeout(mintTimer.current);
      }
    },
    [],
  );

  const setMintOpen = (open: boolean) => {
    if (!open) {
      cancelMint();
    }

    setCreating(open);
  };

  const nameError = /^[a-z0-9-]{3,32}$/u.test(name)
    ? undefined
    : "Use 3 to 32 lowercase letters, digits or dashes.";

  const live = keys.filter((key) => key.env === env && key.revoked !== true);
  const revoked = keys.filter((key) => key.env === env && key.revoked === true);

  const create = () => {
    setTouched(true);

    if (nameError || mintTimer.current !== null) {
      return;
    }

    setPending(true);
    mintTimer.current = window.setTimeout(() => {
      mintTimer.current = null;
      const secret = makeSecret();

      setKeys((current) => [
        {
          env,
          id: `key_${secret.slice(0, 6)}`,
          expires: expiry,
          name,
          owner: "Maren Holt",
          scope,
          secret,
          tail: secret.slice(-4),
          usedAgo: null,
        },
        ...current.map((key) => ({ ...key, secret: undefined })),
      ]);
      setPending(false);
      setCreating(false);
      setTouched(false);
    }, 700);
  };

  const revoke = () => {
    if (!revoking) {
      return;
    }

    setKeys((current) =>
      current.map((key) =>
        key.id === revoking.id ? { ...key, revoked: true, secret: undefined } : key,
      ),
    );
    toast({
      description: "Pipelines still sending it get 401 within a minute.",
      status: "ok",
      title: `${revoking.name} burned`,
    });
    setRevoking(null);
  };

  const done = (target: ApiKey) => {
    setKeys((current) =>
      current.map((key) => (key.id === target.id ? { ...key, secret: undefined } : key)),
    );
  };

  return (
    <Screen
      crumbs={["Kestrel", "storefront", "Settings", "Deploy keys"]}
      description="Keys that pipelines deploy storefront with. A new key is readable in full exactly once, then only by its last four characters, and burning one asks first."
      id="screen-keys"
      title="Deploy keys"
    >
      <PageHeader
        actions={
          <Segmented label="Environment" onValueChange={setEnv} options={ENVS} value={env} />
        }
        title="Deploy keys"
      >
        <span>Each key acts for the repo, never for the person who minted it.</span>
      </PageHeader>

      <Card label="Keys">
        <CardHead
          action={
            <Button
              onClick={() => {
                setCreating(true);
              }}
              size="sm"
              variant="primary"
            >
              <Icon icon={Plus} />
              Mint key
            </Button>
          }
          meta={env}
          title="Keys"
        />
        {live.length === 0 ? (
          <EmptyState title={`No ${env.toLowerCase()} keys`}>
            Mint one key per pipeline. Burning it then stops only that pipeline.
          </EmptyState>
        ) : (
          <div className="fj-rows">
            {live.map((key) => (
              <KeyRow apiKey={key} key={key.id} onDone={done} onRevoke={setRevoking} />
            ))}
          </div>
        )}
        {revoked.length > 0 ? (
          <div className="fj-card-rule">
            <Collapsible
              label={`${revoked.length} burned ${revoked.length === 1 ? "key" : "keys"}`}
            >
              <div className="fj-rows fj-dim">
                {revoked.map((key) => (
                  <KeyRow apiKey={key} key={key.id} onDone={done} onRevoke={setRevoking} />
                ))}
              </div>
            </Collapsible>
          </div>
        ) : null}
      </Card>

      <Dialog
        description="You can read the whole key once, right after it is minted."
        footer={
          <>
            <Button
              onClick={() => {
                setMintOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={create} pending={pending} pendingLabel="Minting" variant="primary">
              Mint key
            </Button>
          </>
        }
        note={`${env} workspace`}
        onOpenChange={setMintOpen}
        open={creating}
        size="lg"
        title="Mint a deploy key"
      >
        <TextField
          autoComplete="off"
          error={touched ? nameError : undefined}
          hint="Name it after the pipeline that will send it."
          label="Name"
          mono
          onBlur={() => {
            setTouched(true);
          }}
          onChange={(event) => {
            setName(event.target.value);
          }}
          value={name}
        />
        <ChoiceList label="Access" onValueChange={setScope} options={SCOPES} value={scope} />
        <Select label="Expires" onValueChange={setExpiry} options={EXPIRY} value={expiry} />
      </Dialog>

      <Dialog
        description={
          revoking
            ? `Pipelines that still send ${revoking.name} start failing. A burned key cannot come back.`
            : undefined
        }
        footer={
          <>
            <Button
              onClick={() => {
                setRevoking(null);
              }}
            >
              Keep it
            </Button>
            <Button onClick={revoke} variant="destructive">
              Burn key
            </Button>
          </>
        }
        onOpenChange={(open) => {
          if (!open) {
            setRevoking(null);
          }
        }}
        open={revoking !== null}
        title={revoking ? `Burn ${revoking.name}?` : "Burn key"}
      />
    </Screen>
  );
};
