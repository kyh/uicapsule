import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { isOwnerMention, isReadyLabel, REQUEST_OWNER_ID } from "./request-trigger";

const owner = { repository: "kyh/uicapsule", senderId: REQUEST_OWNER_ID };
const issue = (...names: string[]) => ({ labels: names.map((name) => ({ name })), number: 42 });

describe("isReadyLabel", () => {
  test("starts a build when the owner labels an issue ready", () => {
    assert.equal(
      isReadyLabel({ ...owner, action: "labeled", issue: issue("request", "ready") }),
      true,
    );
  });

  test("ignores the same label from anyone else", () => {
    assert.equal(
      isReadyLabel({ ...owner, action: "labeled", issue: issue("request", "ready"), senderId: 1 }),
      false,
    );
  });

  test("ignores other labels, a build already under way, other actions and other repositories", () => {
    assert.equal(isReadyLabel({ ...owner, action: "labeled", issue: issue("request") }), false);
    assert.equal(
      isReadyLabel({ ...owner, action: "labeled", issue: issue("ready", "building") }),
      false,
    );
    assert.equal(
      isReadyLabel({ ...owner, action: "opened", issue: issue("request", "ready") }),
      false,
    );
    assert.equal(
      isReadyLabel({
        ...owner,
        action: "labeled",
        issue: issue("request", "ready"),
        repository: "kyh/other",
      }),
      false,
    );
  });

  test("ignores an issue without labels", () => {
    assert.equal(isReadyLabel({ ...owner, action: "labeled", issue: {} }), false);
  });
});

describe("isOwnerMention", () => {
  test("continues a session when the owner names the bot", () => {
    assert.equal(
      isOwnerMention({
        ...owner,
        body: "@UICapsule-Builder re-record it",
        botName: "uicapsule-builder",
      }),
      true,
    );
  });

  test("ignores mentions from anyone else and comments that don't name the bot", () => {
    assert.equal(
      isOwnerMention({
        ...owner,
        body: "@uicapsule-builder go",
        botName: "uicapsule-builder",
        senderId: 1,
      }),
      false,
    );
    assert.equal(
      isOwnerMention({ ...owner, body: "looks good", botName: "uicapsule-builder" }),
      false,
    );
    assert.equal(isOwnerMention({ ...owner, body: "@ go", botName: undefined }), false);
  });
});
