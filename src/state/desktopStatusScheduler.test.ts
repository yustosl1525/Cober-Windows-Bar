import { strict as assert } from "node:assert";
import {
  DESKTOP_STATUS_MEDIA_ALTERNATE_WINDOW_MS,
  DESKTOP_STATUS_PREFERRED_WINDOW_MS,
  DESKTOP_STATUS_PREEMPTION_WINDOW_MS,
  DESKTOP_STATUS_STABILITY_WINDOW_MS,
  getDesktopStatusPriorityOrder,
  scheduleDesktopStatus,
  shouldAlternateMediaWithResident,
} from "./desktopStatusScheduler";

import { describe, it } from "vitest";
describe("desktopStatusScheduler.test", () => {
  it("runs the file's top-level asserts", () => {});
  test("desktop status scheduler falls back to resident by default", () => {
    const decision = scheduleDesktopStatus({
      availableKinds: [
        "resident",
        "media",
        "download",
        "update",
        "clipboard",
        "focus",
        "notification",
      ],
    });

    assert.equal(decision.kind, "resident");
    assert.equal(decision.reason, "fallback");
    assert.equal(decision.changed, true);
  });

  test("desktop status scheduler uses configured priority when multiple kinds are active", () => {
    const decision = scheduleDesktopStatus({
      activeKinds: ["clipboard", "media", "focus"],
      availableKinds: [
        "resident",
        "media",
        "download",
        "update",
        "clipboard",
        "focus",
        "notification",
      ],
    });

    assert.equal(decision.kind, "focus");
    assert.equal(decision.reason, "priority");
    assert.equal(decision.changed, true);
  });

  test("desktop status scheduler lets preferred kind override priority", () => {
    const now = 32_000;
    const decision = scheduleDesktopStatus({
      now,
      preferredKind: "media",
      preferredUntil: now,
      activeKinds: ["focus", "update"],
      availableKinds: [
        "resident",
        "media",
        "download",
        "update",
        "clipboard",
        "focus",
        "notification",
      ],
    });

    assert.equal(decision.kind, "media");
    assert.equal(decision.reason, "preferred");
    assert.equal(decision.changed, true);
  });

  test("desktop status scheduler safely falls back when inputs are missing or unknown", () => {
    const decision = scheduleDesktopStatus({
      activeKinds: ["focus"],
      availableKinds: ["resident"],
    });

    assert.equal(decision.kind, "resident");
    assert.equal(decision.reason, "fallback");
    assert.equal(decision.changed, true);
  });

  test("desktop status priority order is exposed for higher-level resolvers", () => {
    assert.deepEqual(getDesktopStatusPriorityOrder(), [
      "focus",
      "update",
      "notification",
      "download",
      "media",
      "clipboard",
      "resident",
    ]);
  });

  test("desktop status scheduler keeps the previous active kind within the stability window", () => {
    const now = 50_000;
    const decision = scheduleDesktopStatus({
      now,
      previousKind: "media",
      previousChangedAt: now - 1_200,
      activeKinds: ["media", "clipboard"],
      availableKinds: ["resident", "media", "clipboard"],
      activatedAtByKind: {
        media: now - 2_000,
        clipboard: now - 500,
      },
    });

    assert.equal(decision.kind, "media");
    assert.equal(decision.reason, "priority");
    assert.equal(decision.changed, false);
  });

  test("desktop status scheduler allows a newly activated higher-priority kind to preempt within the preemption window", () => {
    const now = 80_000;
    const decision = scheduleDesktopStatus({
      now,
      previousKind: "download",
      previousChangedAt: now - 1_000,
      activeKinds: ["download", "focus"],
      availableKinds: ["resident", "download", "focus"],
      activatedAtByKind: {
        download: now - 5_000,
        focus: now - (DESKTOP_STATUS_PREEMPTION_WINDOW_MS - 1_000),
      },
    });

    assert.equal(decision.kind, "focus");
    assert.equal(decision.reason, "priority");
    assert.equal(decision.changed, true);
  });

  test("desktop status scheduler keeps a manual preference only inside the preferred window", () => {
    const now = 120_000;
    const pinnedDecision = scheduleDesktopStatus({
      now,
      preferredKind: "media",
      preferredUntil: now,
      activeKinds: ["focus"],
      availableKinds: ["resident", "media", "focus"],
    });

    assert.equal(pinnedDecision.kind, "media");
    assert.equal(pinnedDecision.reason, "preferred");
    assert.equal(pinnedDecision.changed, true);

    const expiredDecision = scheduleDesktopStatus({
      now,
      preferredKind: "media",
      preferredUntil: now - DESKTOP_STATUS_PREFERRED_WINDOW_MS * 4 - 1,
      activeKinds: ["focus"],
      availableKinds: ["resident", "media", "focus"],
    });

    assert.equal(expiredDecision.kind, "focus");
    assert.equal(expiredDecision.reason, "priority");
    assert.equal(expiredDecision.changed, true);
  });

  test("desktop status scheduler alternates media and resident every 15s when both are active", () => {
    const baseInput = {
      activeKinds: ["media", "resident"],
      availableKinds: ["resident", "media"],
    } as const;

    const t0 = 1_000_000;
    // First call (no previous decision) — the media-priority entry point
    // picks media (the more interesting state) over the resident fallback.
    const first = scheduleDesktopStatus({
      ...baseInput,
      now: t0,
    });
    assert.equal(first.kind, "media");
    assert.equal(first.changed, true);

    // Within the alternate window we keep the current kind.
    const tooSoon = scheduleDesktopStatus({
      ...baseInput,
      now: t0 + DESKTOP_STATUS_MEDIA_ALTERNATE_WINDOW_MS - 1_000,
      previousKind: first.kind,
      previousChangedAt: t0,
    });
    assert.equal(tooSoon.kind, "media");

    // After the alternate window we flip to resident. (The first call sets
    // previousChangedAt = t0; we step 15s + 100ms past it for the second call,
    // and that also updates previousChangedAt = t0 + 15_100 for the third.)
    const after = scheduleDesktopStatus({
      ...baseInput,
      now: t0 + DESKTOP_STATUS_MEDIA_ALTERNATE_WINDOW_MS + 100,
      previousKind: first.kind,
      previousChangedAt: t0,
    });
    assert.equal(after.kind, "resident");
    assert.equal(after.changed, true);

    // 2nd cycle: after another 15s window we flip back to media.
    const cycle2 = scheduleDesktopStatus({
      ...baseInput,
      now: t0 + DESKTOP_STATUS_MEDIA_ALTERNATE_WINDOW_MS * 2 + 200,
      previousKind: after.kind,
      previousChangedAt: t0 + DESKTOP_STATUS_MEDIA_ALTERNATE_WINDOW_MS + 100,
    });
    assert.equal(cycle2.kind, "media");
    assert.equal(cycle2.changed, true);

    // 3rd cycle: another 15s later, back to media. (Cycle pattern:
    // media → resident → media → resident, but the alternation
    // function takes "the current kind" and returns the OPPOSITE after
    // 15s elapse, so starting from media: → resident, → media, → resident.)
    const cycle3 = scheduleDesktopStatus({
      ...baseInput,
      now: t0 + DESKTOP_STATUS_MEDIA_ALTERNATE_WINDOW_MS * 3 + 300,
      previousKind: cycle2.kind,
      previousChangedAt: t0 + DESKTOP_STATUS_MEDIA_ALTERNATE_WINDOW_MS * 2 + 200,
    });
    assert.equal(cycle3.kind, "resident");
    assert.equal(cycle3.changed, true);
  });

  test("desktop status scheduler does not alternate when media is unavailable", () => {
    const t0 = 2_000_000;
    const decision = scheduleDesktopStatus({
      activeKinds: ["media", "resident"],
      availableKinds: ["resident"],
      now: t0 + DESKTOP_STATUS_MEDIA_ALTERNATE_WINDOW_MS + 1_000,
      previousKind: "resident",
      previousChangedAt: t0,
    });

    assert.equal(decision.kind, "resident");
    assert.equal(decision.reason, "priority");
  });

  test("desktop status scheduler does not preempt higher-priority kinds to alternate", () => {
    const t0 = 3_000_000;
    const decision = scheduleDesktopStatus({
      activeKinds: ["focus", "media", "resident"],
      availableKinds: ["resident", "media", "focus"],
      now: t0 + DESKTOP_STATUS_MEDIA_ALTERNATE_WINDOW_MS + 1_000,
      previousKind: "focus",
      previousChangedAt: t0,
    });

    assert.equal(decision.kind, "focus");
  });

  test("shouldAlternateMediaWithResident skips when not media/resident", () => {
    const result = shouldAlternateMediaWithResident({
      kind: "focus",
      now: 0,
      previousChangedAt: undefined,
      activeKinds: ["focus", "media", "resident"],
      availableKinds: ["resident", "media", "focus"],
    });

    assert.equal(result, "focus");
  });

  test("shouldAlternateMediaWithResident skips when activeKinds do not include media/resident", () => {
    const result = shouldAlternateMediaWithResident({
      kind: "media",
      now: 0,
      previousChangedAt: undefined,
      activeKinds: ["focus"],
      availableKinds: ["resident", "media", "focus"],
    });

    assert.equal(result, "media");
  });
});
