import { z } from "zod";

/** The one repository the request builder works in. */
export const REQUEST_REPOSITORY = "kyh/uicapsule";

/** GitHub user id of `kyh`, the only account whose labels and mentions start or steer a build. */
export const REQUEST_OWNER_ID = 4_271_679;

/** The triage label that accepts a request, and with it starts the build. */
export const READY_LABEL = "ready";

/** The label a build puts on its issue in place of `ready` while it works. */
export const BUILDING_LABEL = "building";

const issueLabelsSchema = z.object({ labels: z.array(z.object({ name: z.string() })) });

interface Actor {
  readonly repository: string;
  readonly senderId: number;
}

const isOwnerInRepository = ({ repository, senderId }: Actor) =>
  senderId === REQUEST_OWNER_ID && repository.toLowerCase() === REQUEST_REPOSITORY;

/**
 * True only when the owner labelled an issue in this repository and it now carries `ready` but not
 * yet `building`. The hook sees the issue, not which label the event added, so two labels applied
 * together both pass; they share the issue's one session, so the second only steers the first.
 */
export const isReadyLabel = (
  input: Actor & { readonly action: string; readonly issue: unknown },
) => {
  if (input.action !== "labeled" || !isOwnerInRepository(input)) {
    return false;
  }

  const parsed = issueLabelsSchema.safeParse(input.issue);

  if (!parsed.success) {
    return false;
  }

  const names = new Set(parsed.data.labels.map((label) => label.name));

  return names.has(READY_LABEL) && !names.has(BUILDING_LABEL);
};

/** True only when the owner names the bot in a comment in this repository. */
export const isOwnerMention = (
  input: Actor & { readonly body: string; readonly botName: string | undefined },
) =>
  input.botName !== undefined &&
  input.botName !== "" &&
  isOwnerInRepository(input) &&
  input.body.toLowerCase().includes(`@${input.botName.toLowerCase()}`);

/** The message that opens a build session for one issue. */
export const buildRequestMessage = (issueNumber: number) =>
  `Issue #${issueNumber} in ${REQUEST_REPOSITORY} was labelled \`${READY_LABEL}\` by its owner. Build it.`;
