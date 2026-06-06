import type { HubMode } from "../../types/hub";
import { Bell, Bot, Download, Layers3, Music2, PanelTop } from "lucide-react";

type ModeSidebarProps = {
  activeMode: HubMode;
  onModeChange: (mode: HubMode) => void;
};

const modes: Array<{ mode: HubMode; title: string; text: string; icon: typeof PanelTop }> = [
  { mode: "idle", title: "悬浮模式", text: "任务栏上方独立停靠，按状态自动展开或收起。", icon: PanelTop },
  { mode: "music", title: "音乐播放", text: "封面、曲名、进度和基础播放控制保持在一行。", icon: Music2 },
  { mode: "aiProgress", title: "AI 任务", text: "生成中、等待响应、完成等进度状态清晰可扫。", icon: Bot },
  { mode: "download", title: "下载状态", text: "文件进度、大小和百分比以系统提示密度呈现。", icon: Download },
  { mode: "notification", title: "消息通知", text: "收到消息后短暂展开，并自动回到空闲。", icon: Bell },
  { mode: "multiTask", title: "多任务堆叠", text: "多个任务同时存在时展开为状态列表。", icon: Layers3 },
];

export function ModeSidebar({ activeMode, onModeChange }: ModeSidebarProps) {
  return (
    <aside className="space-y-5 font-['Segoe_UI','Microsoft_YaHei',system-ui,sans-serif]">
      <div className="rounded-[24px] border border-white/10 bg-white/[0.045] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl">
        <h1 className="text-[2rem] font-semibold leading-tight tracking-normal text-white sm:text-[2.35rem]">
          Windows 11 智能状态中心
        </h1>
        <p className="mt-2 text-lg font-medium text-slate-200">Smart Status Hub</p>
        <p className="mt-4 max-w-md text-[15px] leading-7 text-slate-300">
          位于屏幕右下角，展示正在进行的任务和重要通知，支持多种显示模式，可与任务栏融合。
        </p>
      </div>

      <div className="rounded-[22px] border border-white/10 bg-[rgba(243,248,255,0.075)] p-2 shadow-[0_18px_46px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-2xl">
        <div className="px-3 pb-2 pt-2 text-[13px] font-semibold text-slate-300">显示模式</div>
        <nav className="space-y-1">
          {modes.map((item) => {
            const Icon = item.icon;
            const selected = activeMode === item.mode;
            return (
            <button
              key={item.mode}
              type="button"
              onClick={() => onModeChange(item.mode)}
              aria-current={selected ? "page" : undefined}
              className={`group relative flex w-full items-center gap-3 rounded-[10px] border px-3 py-2.5 text-left transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 ${
                selected
                  ? "border-white/12 bg-white/[0.13] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_8px_24px_rgba(0,0,0,0.18)]"
                  : "border-transparent text-slate-200 hover:border-white/8 hover:bg-white/[0.075]"
              }`}
            >
              <span
                className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full transition ${
                  selected ? "bg-[#60cdff] opacity-100" : "bg-transparent opacity-0"
                }`}
              />
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                selected ? "bg-[#60cdff]/18 text-[#8bd8ff]" : "bg-white/[0.055] text-slate-300 group-hover:text-slate-100"
              }`}>
                <Icon size={18} strokeWidth={1.8} />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold leading-5">{item.title}</span>
                <span className="mt-0.5 block text-[13px] leading-5 text-slate-400">{item.text}</span>
              </span>
            </button>
          )})}
        </nav>
      </div>
    </aside>
  );
}
