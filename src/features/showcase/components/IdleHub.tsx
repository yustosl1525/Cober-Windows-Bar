import { motion, useReducedMotion } from "framer-motion";

import { FluentIconChip } from "./ShowcaseFluentTokens";

export function IdleHub() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.section
      className="hub-idle relative flex min-w-[240px] items-center justify-between gap-3 overflow-hidden rounded-[9999px] bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.5)_100%)] px-4 py-3 text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.78)] backdrop-blur-[24px] backdrop-saturate-150 supports-[backdrop-filter]:bg-[linear-gradient(180deg,rgba(255,255,255,0.62)_0%,rgba(241,245,249,0.44)_100%)]"
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 6, scale: 0.985 }}
      animate={
        prefersReducedMotion
          ? undefined
          : {
              opacity: 1,
              y: [0, -1, 0],
              scale: 1,
            }
      }
      transition={
        prefersReducedMotion
          ? undefined
          : {
              opacity: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
              y: { duration: 5.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
            }
      }
      aria-label="Idle hub preview with resident music, AI, and download entry points"
    >
      <div className="relative z-[1] flex items-center gap-2.5">
        <FluentIconChip mode="music" compact />
        <FluentIconChip mode="ai" compact />
        <FluentIconChip mode="download" compact />
      </div>

      <div className="relative z-[1] min-w-0 flex-1 text-left">
        <div className="truncate text-[13px] font-semibold tracking-[0] text-slate-900">
          Status Center Ready
        </div>
        <div className="mt-0.5 truncate text-[11px] font-medium tracking-[0] text-slate-600">
          Waiting for media, AI, download, or system events
        </div>
      </div>

      <div className="relative z-[1] flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[radial-gradient(circle,#4ade80_0%,#16a34a_100%)] shadow-[0_0_0_4px_rgba(74,222,128,0.14)]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0] text-emerald-700">
          Idle
        </span>
      </div>
    </motion.section>
  );
}
