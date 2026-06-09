import { strict as assert } from "node:assert";
import { getDesktopStatusPriorityOrder, scheduleDesktopStatus } from "./desktopStatusScheduler";

function test(name: string, run: () => void) {
  run();
  console.log(`ok ${name}`);
}

test("desktop status scheduler falls back to resident by default", () => {
  const decision = scheduleDesktopStatus({
    availableKinds: ["resident", "media", "download", "update", "clipboard", "focus"],
  });

  assert.equal(decision.kind, "resident");
  assert.equal(decision.reason, "fallback");
});

test("desktop status scheduler uses configured priority when multiple kinds are active", () => {
  const decision = scheduleDesktopStatus({
    activeKinds: ["clipboard", "media", "focus"],
    availableKinds: ["resident", "media", "download", "update", "clipboard", "focus"],
  });

  assert.equal(decision.kind, "focus");
  assert.equal(decision.reason, "priority");
});

test("desktop status scheduler lets preferred kind override priority", () => {
  const decision = scheduleDesktopStatus({
    preferredKind: "media",
    activeKinds: ["focus", "update"],
    availableKinds: ["resident", "media", "download", "update", "clipboard", "focus"],
  });

  assert.equal(decision.kind, "media");
  assert.equal(decision.reason, "preferred");
});

test("desktop status scheduler safely falls back when inputs are missing or unknown", () => {
  const decision = scheduleDesktopStatus({
    activeKinds: ["focus"],
    availableKinds: ["resident"],
  });

  assert.equal(decision.kind, "resident");
  assert.equal(decision.reason, "fallback");
});

test("desktop status priority order is exposed for higher-level resolvers", () => {
  assert.deepEqual(getDesktopStatusPriorityOrder(), [
    "focus",
    "update",
    "download",
    "media",
    "clipboard",
    "resident",
  ]);
});
