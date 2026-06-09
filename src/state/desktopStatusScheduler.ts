import { DESKTOP_STATUS_PRIORITY_ORDER } from "../data/desktopStatusConfig";
import type {
  DesktopStatusKind,
  DesktopStatusScheduleDecision,
  DesktopStatusSchedulerInput,
} from "../types/hub";

export const DESKTOP_STATUS_FALLBACK_KIND: DesktopStatusKind = "resident";

function dedupeKinds(kinds: DesktopStatusKind[] | undefined): DesktopStatusKind[] {
  if (!kinds?.length) {
    return [];
  }

  return kinds.filter((kind, index) => kinds.indexOf(kind) === index);
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

export function scheduleDesktopStatus(input: DesktopStatusSchedulerInput): DesktopStatusScheduleDecision {
  const availableKinds = filterKnownKinds(dedupeKinds(input.availableKinds));
  const preferredKind = input.preferredKind;

  if (preferredKind && availableKinds.includes(preferredKind)) {
    return {
      kind: preferredKind,
      reason: "preferred",
    };
  }

  const activeKinds = filterKnownKinds(dedupeKinds(input.activeKinds));
  const activeAvailableKinds = activeKinds.filter((kind) => availableKinds.includes(kind));

  for (const kind of DESKTOP_STATUS_PRIORITY_ORDER) {
    if (activeAvailableKinds.includes(kind)) {
      return {
        kind,
        reason: "priority",
      };
    }
  }

  if (availableKinds.includes(DESKTOP_STATUS_FALLBACK_KIND)) {
    return {
      kind: DESKTOP_STATUS_FALLBACK_KIND,
      reason: "fallback",
    };
  }

  const firstKnownAvailableKind = availableKinds[0];
  if (firstKnownAvailableKind) {
    return {
      kind: firstKnownAvailableKind,
      reason: "fallback",
    };
  }

  return {
    kind: DESKTOP_STATUS_FALLBACK_KIND,
    reason: "fallback",
  };
}
