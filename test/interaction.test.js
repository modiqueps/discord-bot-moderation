import assert from "node:assert/strict";
import test from "node:test";
import { interactionResponse } from "../src/util/interaction.js";

function createInteraction({ deferred = false, replied = false } = {}) {
  const calls = [];

  return {
    calls,
    deferred,
    editReply: (options) => {
      calls.push(["editReply", options]);
      return options;
    },
    followUp: (options) => {
      calls.push(["followUp", options]);
      return options;
    },
    replied,
    reply: (options) => {
      calls.push(["reply", options]);
      return options;
    },
  };
}

test("replies when the interaction is untouched", async () => {
  const interaction = createInteraction();

  await interactionResponse(interaction, { content: "hello" });

  assert.deepEqual(interaction.calls, [["reply", { content: "hello" }]]);
});

test("edits the deferred reply", async () => {
  const interaction = createInteraction({ deferred: true });

  await interactionResponse(interaction, { content: "done" });

  assert.equal(interaction.calls[0][0], "editReply");
});

test("strips flags when editing, because an edit cannot change visibility", async () => {
  const interaction = createInteraction({ deferred: true });

  await interactionResponse(interaction, { content: "done", flags: 64 });

  const [, options] = interaction.calls[0];
  assert.equal(options.content, "done");
  assert.ok(!("flags" in options));
});

test("follows up instead of overwriting an existing reply", async () => {
  const interaction = createInteraction({ replied: true });

  await interactionResponse(interaction, { content: "extra" });

  // editReply here would replace what the user was already shown.
  assert.equal(interaction.calls[0][0], "followUp");
});

test("keeps flags on a follow-up, so it can stay ephemeral", async () => {
  const interaction = createInteraction({ replied: true });

  await interactionResponse(interaction, { content: "extra", flags: 64 });

  const [, options] = interaction.calls[0];
  assert.equal(options.flags, 64);
});
