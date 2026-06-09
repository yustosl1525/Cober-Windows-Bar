import { motion, useReducedMotion } from "framer-motion";
import {
  Bot,
  Download,
  GitBranch,
  LayoutGrid,
  MessageCircleMore,
  Music2,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

export type ShowcaseFluentMode = "ai" | "music" | "download" | "notification" | "git" | "multiTask";

type ShowcaseModeVisual = {
  icon: LucideIcon;
  chipClassName: string;
  iconClassName: string;
  progressClassName: string;
  trackGlowClassName: string;
};

export const showcaseModeVisuals: Record<ShowcaseFluentMode, ShowcaseModeVisual> = {
  ai: {
    icon: Bot,
    chipClassName:
      "border-white/35 bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.82),transparent_42%),linear-gradient(145deg,rgba(196,181,253,0.96)_0%,rgba(147,197,253,0.80)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_6px_16px_rgba(109,40,217,0.16)]",
    iconClassName: "text-violet-700",
    progressClassName: "bg-[linear-gradient(90deg,#7c3aed_0%,#8b5cf6_52%,#c084fc_100%)]",
    trackGlowClassName: "shadow-[0_0_10px_rgba(139,92,246,0.28)]",
  },
  music: {
    icon: Music2,
    chipClassName:
      "border-white/35 bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.82),transparent_42%),linear-gradient(145deg,rgba(251,207,232,0.96)_0%,rgba(196,181,253,0.82)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.68),0_6px_16px_rgba(219,39,119,0.14)]",
    iconClassName: "text-fuchsia-700",
    progressClassName: "bg-[linear-gradient(90deg,#db2777_0%,#ec4899_48%,#a855f7_100%)]",
    trackGlowClassName: "shadow-[0_0_10px_rgba(236,72,153,0.24)]",
  },
  download: {
    icon: Download,
    chipClassName:
      "border-white/35 bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.84),transparent_42%),linear-gradient(145deg,rgba(187,247,208,0.96)_0%,rgba(167,243,208,0.82)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.68),0_6px_16px_rgba(5,150,105,0.14)]",
    iconClassName: "text-emerald-700",
    progressClassName: "bg-[linear-gradient(90deg,#059669_0%,#10b981_52%,#34d399_100%)]",
    trackGlowClassName: "shadow-[0_0_10px_rgba(16,185,129,0.24)]",
  },
  notification: {
    icon: MessageCircleMore,
    chipClassName:
      "border-white/35 bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.84),transparent_42%),linear-gradient(145deg,rgba(253,230,138,0.95)_0%,rgba(252,211,77,0.78)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.68),0_6px_16px_rgba(217,119,6,0.14)]",
    iconClassName: "text-amber-700",
    progressClassName: "bg-[linear-gradient(90deg,#d97706_0%,#f59e0b_50%,#fbbf24_100%)]",
    trackGlowClassName: "shadow-[0_0_10px_rgba(245,158,11,0.22)]",
  },
  git: {
    icon: GitBranch,
    chipClassName:
      "border-white/35 bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.84),transparent_42%),linear-gradient(145deg,rgba(191,219,254,0.96)_0%,rgba(186,230,253,0.80)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.68),0_6px_16px_rgba(37,99,235,0.14)]",
    iconClassName: "text-sky-700",
    progressClassName: "bg-[linear-gradient(90deg,#2563eb_0%,#0ea5e9_52%,#38bdf8_100%)]",
    trackGlowClassName: "shadow-[0_0_10px_rgba(14,165,233,0.24)]",
  },
  multiTask: {
    icon: LayoutGrid,
    chipClassName:
      "border-white/35 bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.84),transparent_42%),linear-gradient(145deg,rgba(226,232,240,0.96)_0%,rgba(196,181,253,0.76)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.68),0_6px_16px_rgba(100,116,139,0.14)]",
    iconClassName: "text-slate-700",
    progressClassName: "bg-[linear-gradient(90deg,#64748b_0%,#8b5cf6_52%,#38bdf8_100%)]",
    trackGlowClassName: "shadow-[0_0_10px_rgba(129,140,248,0.22)]",
  },
};

type FluentIconChipProps = {
  mode: ShowcaseFluentMode;
  compact?: boolean;
  children?: ReactNode;
};

export function FluentIconChip({ mode, compact = false, children }: FluentIconChipProps) {
  const visual = showcaseModeVisuals[mode];
  const Icon = visual.icon;

  return (
    <div
      className={`relative z-[1] flex shrink-0 items-center justify-center rounded-full border ${compact ? "h-9 w-9" : "h-10 w-10"} ${visual.chipClassName}`}
    >
      <div className="absolute inset-[7px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0)_72%)] blur-[4px]" />
      {children ?? (
        <Icon
          aria-hidden="true"
          className={`relative z-[1] ${compact ? "h-4 w-4" : "h-[17px] w-[17px]"} ${visual.iconClassName} drop-shadow-[0_1px_2px_rgba(15,23,42,0.14)]`}
          strokeWidth={2.2}
        />
      )}
    </div>
  );
}

type FluentProgressRailProps = {
  mode: ShowcaseFluentMode;
  value: number;
  label: string;
  active?: boolean;
  shimmer?: boolean;
};

export function FluentProgressRail({
  mode,
  value,
  label,
  active = true,
  shimmer = true,
}: FluentProgressRailProps) {
  const prefersReducedMotion = useReducedMotion();
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(value, 100)) : 0;
  const visual = showcaseModeVisuals[mode];

  return (
    <div
      className="relative h-[5px] w-full overflow-hidden rounded-full bg-[linear-gradient(180deg,rgba(148,163,184,0.20),rgba(148,163,184,0.12))] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeValue}
    >
      <motion.div
        className={`absolute inset-y-0 left-0 rounded-full ${visual.progressClassName} ${visual.trackGlowClassName}`}
        initial={prefersReducedMotion ? undefined : { width: 0 }}
        animate={{ width: `${safeValue}%` }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.32,
          ease: [0.2, 0.8, 0.2, 1],
        }}
      />

      {!prefersReducedMotion && active && shimmer && safeValue > 0 && safeValue < 100 ? (
        <motion.div
          className="absolute inset-y-0 w-12 rounded-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.34),transparent)] blur-[1px]"
          animate={{ x: ["-140%", "320%"] }}
          transition={{
            duration: 2.2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      ) : null}
    </div>
  );
}
