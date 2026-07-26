import assert from "node:assert/strict";
import test from "node:test";
import {
  canPostIn,
  validateModerationTarget,
  validateRole,
} from "../src/util/moderation.js";

function createInteraction({
  actorId = "actor",
  actorPosition = 10,
  botPosition = 20,
  ownerId = "owner",
} = {}) {
  return {
    client: { user: { id: "bot" } },
    guild: {
      id: "guild",
      members: {
        me: {
          roles: {
            highest: {
              comparePositionTo: (role) => botPosition - role.position,
            },
          },
        },
      },
      ownerId,
    },
    member: {
      roles: {
        highest: {
          comparePositionTo: (role) => actorPosition - role.position,
        },
      },
    },
    user: { id: actorId },
  };
}

function createTarget({ id = "target", manageable = true, position = 5 } = {}) {
  return {
    id,
    manageable,
    roles: { highest: { position } },
  };
}

test("prevents targeting the actor and the server owner", () => {
  const interaction = createInteraction();

  assert.match(
    validateModerationTarget(interaction, createTarget({ id: "actor" })),
    /on yourself/,
  );
  assert.match(
    validateModerationTarget(interaction, createTarget({ id: "owner" })),
    /server owner/,
  );
});

test("prevents targeting the bot itself", () => {
  const interaction = createInteraction();

  assert.match(
    validateModerationTarget(interaction, createTarget({ id: "bot" })),
    /on the bot/,
  );
});

test("reports a member that could not be resolved", () => {
  assert.match(
    validateModerationTarget(createInteraction(), null),
    /could not be found/,
  );
});

test("validates role hierarchy and bot capability", () => {
  const interaction = createInteraction();

  assert.match(
    validateModerationTarget(interaction, createTarget({ position: 10 })),
    /equal to or higher/,
  );
  assert.match(
    validateModerationTarget(interaction, createTarget({ manageable: false })),
    /bot's role hierarchy/,
  );
  assert.equal(validateModerationTarget(interaction, createTarget()), null);
});

test("checks the requested capability, not just manageability", () => {
  const interaction = createInteraction();
  const target = { ...createTarget(), bannable: false, kickable: true };

  assert.match(
    validateModerationTarget(interaction, target, "bannable"),
    /bot's role hierarchy/,
  );
  assert.equal(validateModerationTarget(interaction, target, "kickable"), null);
});

test("lets the server owner bypass the hierarchy check", () => {
  const interaction = createInteraction({ actorId: "owner" });

  // A role above the actor's would normally be refused.
  assert.equal(
    validateModerationTarget(interaction, createTarget({ position: 99 })),
    null,
  );
});

test("rejects roles that cannot be assigned", () => {
  const interaction = createInteraction();

  assert.match(validateRole(interaction, { id: "guild" }), /@everyone/);
  assert.match(
    validateRole(interaction, { id: "managed", managed: true, position: 1 }),
    /managed by integrations/,
  );
  assert.match(
    validateRole(interaction, { id: "high", managed: false, position: 10 }),
    /equal to or higher than your highest role/,
  );
  assert.equal(
    validateRole(interaction, {
      id: "assignable",
      managed: false,
      position: 5,
    }),
    null,
  );
});

test("rejects a role the bot cannot reach", () => {
  const interaction = createInteraction({ botPosition: 3 });

  assert.match(
    validateRole(interaction, { id: "role", managed: false, position: 5 }),
    /higher than the bot's highest role/,
  );
});

test("canPostIn reflects channel overwrites", () => {
  const guild = { members: { me: {} } };

  assert.equal(
    canPostIn({ permissionsFor: () => ({ has: () => true }) }, guild, []),
    true,
  );
  assert.equal(
    canPostIn({ permissionsFor: () => ({ has: () => false }) }, guild, []),
    false,
  );
  // permissionsFor returns null for a member the channel cannot resolve.
  assert.equal(canPostIn({ permissionsFor: () => null }, guild, []), false);
});
