import { DESKTOP_STATUS_PRIORITY_ORDER } from "../data/desktopStatusConfig";
import { dedupeKindsOrEmpty } from "../shared/runtimeGuards";
import type {
  DesktopStatusKind,
  DesktopStatusScheduleDecision,
  DesktopStatusSchedulerInput,
} from "../types/hub";

export const DESKTOP_STATUS_FALLBACK_KIND: DesktopStatusKind = "resident";
export const DESKTOP_STATUS_STABILITY_WINDOW_MS = 6_000;
export const DESKTOP_STATUS_PREFERRED_WINDOW_MS = 20_000;
export const DESKTOP_STATUS_PREEMPTION_WINDOW_MS = 12_000;
export const DESKTOP_STATUS_MEDIA_ALTERNATE_WINDOW_MS = 15_000;

function isWithinWindow(timestamp: number | undefined, now: number, durationMs: number): boolean {
  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
    return false;
  }

  return timestamp <= now && now - timestamp <= durationMs;
}

function filterKnownKinds(kinds: DesktopStatusKind[] | undefined): DesktopStatusKind[] {
  if (!kinds?.length) {
    return [];
  }

  return kinds.filter((kind) => DESKTOP_STATUS_PRIORITY_ORDER.includes(kind));
}

export function getDesktopStatusPriorityOrder(): DesktopStatusKind[] {
  return [...DESKTOP_STATUS_PRIORITY_ORDER];
}

export function scheduleDesktopStatus(
  input: DesktopStatusSchedulerInput,
): DesktopStatusScheduleDecision {
  const now = typeof input.now === "number" && Number.isFinite(input.now) ? input.now : 0;
  const availableKinds = filterKnownKinds(dedupeKindsOrEmpty(input.availableKinds));
  const preferredKind = input.preferredKind;
  const previousKind = input.previousKind;
  const activeKinds = filterKnownKinds(dedupeKindsOrEmpty(input.activeKinds));
  const activeAvailableKinds = activeKinds.filter((kind) => availableKinds.includes(kind));
  const preferredStillPinned =
    preferredKind &&
    availableKinds.includes(preferredKind) &&
    isWithinWindow(input.preferredUntil, now, DESKTOP_STATUS_PREFERRED_WINDOW_MS * 4);

  const initialDecision =
    preferredKind && availableKinds.includes(preferredKind) && preferredStillPinned
      ? {
          kind: preferredKind as DesktopStatusKind,
          reason: "preferred" as const,
          changed: preferredKind !== previousKind,
        }
      : (() => {
          // Special case: the 15s media/resident alternation cycle drives
          // what to show when both kinds are available and active AND no
          // higher-priority kind (focus/update/notification/download) is
          // active. We start on "media" (the more interesting state) and
          // let subsequent calls drive the alternation.
          if (
            previousKind === undefined &&
            shouldConsiderMediaResidentAlternation(activeKinds, availableKinds) &&
            !activeAvailableKinds.some((kind) => {
              const priority = DESKTOP_STATUS_PRIORITY_ORDER.indexOf(kind);
              return priority !== -1 && priority < DESKTOP_STATUS_PRIORITY_ORDER.indexOf("media");
            })
          ) {
            return {
              kind: "media" as DesktopStatusKind,
              reason: "priority" as const,
              changed: true,
            };
          }

          const previousStillStable =
            previousKind &&
            activeAvailableKinds.includes(previousKind) &&
            isWithinWindow(input.previousChangedAt, now, DESKTOP_STATUS_STABILITY_WINDOW_MS);

          if (previousStillStable) {
            const previousPriority = DESKTOP_STATUS_PRIORITY_ORDER.indexOf(previousKind);
            const canPreemptPrevious = activeAvailableKinds.some((kind) => {
              const priority = DESKTOP_STATUS_PRIORITY_ORDER.indexOf(kind);
              const activatedAt = input.activatedAtByKind?.[kind];
              return (
                priority !== -1 &&
                priority < previousPriority &&
                isWithinWindow(activatedAt, now, DESKTOP_STATUS_PREEMPTION_WINDOW_MS)
              );
            });

            if (!canPreemptPrevious) {
              return {
                kind: previousKind,
                reason: "priority" as const,
                changed: false,
              };
            }
          }

          for (const kind of DESKTOP_STATUS_PRIORITY_ORDER) {
            if (activeAvailableKinds.includes(kind)) {
              return {
                kind,
                reason: "priority" as const,
                changed: kind !== previousKind,
              };
            }
          }

          if (availableKinds.includes(DESKTOP_STATUS_FALLBACK_KIND)) {
            return {
              kind: DESKTOP_STATUS_FALLBACK_KIND,
              reason: "fallback" as const,
              changed: DESKTOP_STATUS_FALLBACK_KIND !== previousKind,
            };
          }

          const firstKnownAvailableKind = availableKinds[0];
          if (firstKnownAvailableKind) {
            return {
              kind: firstKnownAvailableKind,
              reason: "fallback" as const,
              changed: firstKnownAvailableKind !== previousKind,
            };
          }

          return {
            kind: DESKTOP_STATUS_FALLBACK_KIND,
            reason: "fallback" as const,
            changed: DESKTOP_STATUS_FALLBACK_KIND !== previousKind,
          };
        })();

  const alternateKind = shouldAlternateMediaWithResident({
    kind: initialDecision.kind,
    now,
    previousChangedAt: input.previousChangedAt,
    activeKinds,
    availableKinds,
    previousKind,
  });

  if (alternateKind !== initialDecision.kind) {
    return {
      kind: alternateKind,
      reason: initialDecision.reason,
      changed: alternateKind !== previousKind,
    };
  }

  return initialDecision;
}

/**
 * Returns true when both `media` and `resident` are available + active — the
 * preconditions for the 15s media/resident alternation cycle. This is the
 * canonical helper used by the scheduler AND by callers who want to know
 * whether the alternation policy applies.
 */
function shouldConsiderMediaResidentAlternation(
  activeKinds: DesktopStatusKind[],
  availableKinds: DesktopStatusKind[],
): boolean {
  return (
    availableKinds.includes("media") &&
    availableKinds.includes("resident") &&
    (activeKinds.includes("media") || activeKinds.includes("resident"))
  );
}

/**
 * Alternates the visible kind between "media" and "resident" when both are
 * available and at least one is active. Each cycle is
 * `DESKTOP_STATUS_MEDIA_ALTERNATE_WINDOW_MS` long, so the bar shows media
 * for 15s, resident for 15s, media for 15s, etc. while a media session is
 * live.
 *
 * Skips alternation when:
 *  - Either kind is unavailable or inactive
 *  - The current kind is something other than media/resident (focus,
 *    download, notification, etc. always win)
 *  - We are inside the elapsed window since the previous change
 *    (prevents mid-window thrash from minor metric/clipboard noise)
 */
export function shouldAlternateMediaWithResident({
  kind,
  now,
  previousChangedAt,
  activeKinds,
  availableKinds,
  previousKind,
}: {
  kind: DesktopStatusKind;
  now: number;
  previousChangedAt: number | undefined;
  activeKinds: DesktopStatusKind[];
  availableKinds: DesktopStatusKind[];
  previousKind?: DesktopStatusKind;
}): DesktopStatusKind {
  const bothAvailable = availableKinds.includes("media") && availableKinds.includes("resident");
  const eitherActive = activeKinds.includes("media") || activeKinds.includes("resident");

  if (!bothAvailable || !eitherActive) {
    return kind;
  }

  if (kind !== "media" && kind !== "resident") {
    return kind;
  }

  // First call after the scheduler starts (no previous change yet): keep the
  // initial kind (priority) and let subsequent calls drive the alternation.
  if (previousChangedAt === undefined) {
    return kind;
  }

  if (
    !Number.isFinite(previousChangedAt) ||
    now - previousChangedAt < DESKTOP_STATUS_MEDIA_ALTERNATE_WINDOW_MS
  ) {
    return kind;
  }

  // The alternation flips based on the *previously shown* kind so the
  // 15s cadence stays consistent across calls: when we last showed
  // media, the next alternation switches to resident (and vice versa).
  const basis = previousKind === "media" || previousKind === "resident" ? previousKind : kind;
  return basis === "media" ? "resident" : "media";
}
