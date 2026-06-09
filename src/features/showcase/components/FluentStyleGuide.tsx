import type { ReactNode } from "react";
import { Bot, Download, Folder, GitBranch, LayoutGrid, MessageCircleMore, Music2, PanelTop, Search } from "lucide-react";
import { FluentIconChip, FluentProgressRail } from "./ShowcaseFluentTokens";

export function FluentStyleGuide() {
  return (
    <section className="grid gap-4 font-['Segoe_UI','Microsoft_YaHei',system-ui,sans-serif] xl:grid-cols-[1.05fr_0.95fr]">
      <div>
        <h2 className="mb-4 text-xl font-semibold text-white">Windows 11 Fluent System</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 min-[1700px]:grid-cols-5">
          <SpecCard
            title="Acrylic capsule"
            value="Soft glass surface"
            swatch="bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(255,255,255,0.42))]"
          />
          <SpecCard title="Backdrop blur" value="24px + saturate" swatch="bg-white/[0.12] backdrop-blur-2xl" />
          <SpecCard title="Shape language" value="9999px / 30px / 22px" swatch="bg-violet-300/18" />
          <SpecCard title="Typography" value="Segoe UI hierarchy" swatch="bg-slate-100/14" />
          <SpecCard title="Mode accents" value="AI / Media / Download / Notify / Git / Multi" swatch="bg-[linear-gradient(90deg,#7c3aed,#ec4899,#10b981,#f59e0b,#0ea5e9)]" />

          <div className="rounded-[18px] border border-white/10 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl">
            <div className="text-sm text-slate-300">Mode chips</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <FluentIconChip mode="music" compact />
              <FluentIconChip mode="ai" compact />
              <FluentIconChip mode="download" compact />
              <FluentIconChip mode="notification" compact />
              <FluentIconChip mode="git" compact />
              <FluentIconChip mode="multiTask" compact />
            </div>
          </div>

          <div className="rounded-[18px] border border-white/10 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl md:col-span-2 min-[1700px]:col-span-2">
            <div className="text-sm text-slate-300">Progress rails</div>
            <div className="mt-3 grid gap-3">
              <FluentRailRow label="AI" mode="ai" value={68} />
              <FluentRailRow label="Music" mode="music" value={56} />
              <FluentRailRow label="Download" mode="download" value={48} />
            </div>
          </div>

          <div className="rounded-[18px] border border-white/10 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl md:col-span-2 min-[1700px]:col-span-2">
            <div className="text-sm text-slate-300">Future mode palette</div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-100 min-[1700px]:grid-cols-3">
              <ModePill icon={<Bot size={14} />} label="AI" tint="bg-violet-300/16 text-violet-100" />
              <ModePill icon={<Music2 size={14} />} label="Music" tint="bg-fuchsia-300/16 text-fuchsia-100" />
              <ModePill icon={<Download size={14} />} label="Download" tint="bg-emerald-300/16 text-emerald-100" />
              <ModePill icon={<MessageCircleMore size={14} />} label="Notification" tint="bg-amber-300/16 text-amber-100" />
              <ModePill icon={<GitBranch size={14} />} label="Git" tint="bg-sky-300/16 text-sky-100" />
              <ModePill icon={<LayoutGrid size={14} />} label="MultiTask" tint="bg-slate-200/16 text-slate-100" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-white">Desktop placement</h2>
        <div className="relative h-[248px] overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(86,159,255,0.28),rgba(32,49,73,0.5)_45%,rgba(8,17,31,0.9))] p-5 shadow-[0_20px_58px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.16)]">
          <div className="absolute inset-x-8 top-7 h-20 rounded-[24px] border border-white/10 bg-white/[0.045] backdrop-blur-xl" />
          <div className="absolute bottom-0 left-0 right-0 flex h-14 items-center justify-center gap-3 border-t border-white/15 bg-[rgba(14,22,34,0.72)] px-4 backdrop-blur-2xl">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-white/[0.07]">
              <Search size={17} />
            </span>
            <span className="relative grid h-9 w-9 place-items-center rounded-[10px] bg-white/[0.11] text-[#60cdff]">
              <PanelTop size={18} />
              <span className="absolute bottom-1 h-0.5 w-4 rounded-full bg-[#60cdff]" />
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-white/[0.07]">
              <Folder size={17} />
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-white/[0.07]">
              <Bot size={17} />
            </span>
            <span className="ml-2 text-xs leading-4 text-slate-100">
              16:20
              <br />
              2024/05/20
            </span>
          </div>

          <div className="absolute bottom-[66px] right-5 min-w-[242px] rounded-[9999px] border border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.70),rgba(255,255,255,0.48))] px-4 py-3 text-slate-900 shadow-[0_16px_40px_rgba(14,116,144,0.18),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-2xl">
            <div className="flex items-center gap-3">
              <FluentIconChip mode="ai" compact />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-slate-900">GPT-5.5</div>
                <div className="truncate text-[11px] font-medium text-slate-600">Generating code...</div>
              </div>
              <span className="text-[10px] font-semibold uppercase text-violet-700">Live</span>
            </div>
            <div className="mt-2.5">
              <FluentProgressRail mode="ai" value={68} label="Desktop placement sample progress" />
            </div>
          </div>

          <div className="absolute right-8 top-8 rounded-[14px] border border-white/12 bg-white/[0.11] px-4 py-3 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl">
            Floats above windowed apps
            <br />
            Avoids fullscreen surfaces
          </div>
        </div>
      </div>
    </section>
  );
}

function SpecCard({ title, value, swatch }: { title: string; value: string; swatch: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl">
      <div className={`mb-3 h-8 rounded-[12px] border border-white/10 ${swatch}`} />
      <div className="text-sm text-slate-300">{title}</div>
      <div className="mt-2 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function FluentRailRow({
  label,
  mode,
  value,
}: {
  label: string;
  mode: Parameters<typeof FluentProgressRail>[0]["mode"];
  value: number;
}) {
  return (
    <div className="grid grid-cols-[48px_minmax(0,1fr)_36px] items-center gap-3">
      <span className="text-xs font-semibold text-slate-200">{label}</span>
      <FluentProgressRail mode={mode} value={value} label={`${label} token progress`} />
      <span className="text-right text-[11px] font-medium tabular-nums text-slate-300">{value}%</span>
    </div>
  );
}

function ModePill({ icon, label, tint }: { icon: ReactNode; label: string; tint: string }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 ${tint}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
