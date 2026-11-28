import { defaultGitHubAuth, githubChannel } from "eve/channels/github";

import {
  buildRequestMessage,
  isOwnerMention,
  isReadyLabel,
  READY_LABEL,
} from "../lib/request-trigger";

export default githubChannel({
  onComment: (ctx, comment) =>
    isOwnerMention({
      body: comment.body,
      botName: process.env.GITHUB_APP_SLUG,
      repository: ctx.repository.fullName,
      senderId: ctx.sender.id,
    })
      ? { auth: defaultGitHubAuth(ctx) }
      : null,
  onIssue: (ctx, issue) =>
    isReadyLabel({
      action: issue.action,
      issue: issue.raw,
      repository: ctx.repository.fullName,
      senderId: ctx.sender.id,
    })
      ? {
          auth: defaultGitHubAuth(ctx),
          context: [buildRequestMessage(issue.issueNumber)],
          title: `Build #${issue.issueNumber} (${READY_LABEL})`,
        }
      : null,
});
