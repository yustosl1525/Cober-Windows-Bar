import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BatteryMedium, Bell, Bot, Download, Music2, Wifi } from "lucide-react";
import { HubShell } from "../components/hub/HubShell";
import { createHubDemoScenario, playHubDemoScenario, type HubDemoScenarioId } from "../state/hubScenarios";
import { createHubEventBus } from "../state/hubState";
import type { HubMode, HubStoreState } from "../types/hub";

const desktopSequence: HubDemoScenarioId[] = ["idle", "music", "ai", "download", "notification", "multiTask"];

const modeLabel: Record<HubMode, string> = {
  idle: "Idle",
  music: "Music",
  aiProgress: "AI",
  download: "Download",
  notification: "Notify",
  multiTask: "Multi",
};

export function DesktopPage() {
  const eventBus = useMemo(() => createHubEventBus(), []);
  const [storeState, setStoreState] = useState<HubStoreState>(() => eventBus.getState());
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => eventBus.subscribe(setStoreState), [eventBus]);

  useEffect(() => {
    const scenarioId = desktopSequence[stepIndex % desktopSequence.length] ?? "idle";
    playHubDemoScenario(eventBus, createHubDemoScenario(scenarioId, Date.now()), Date.now());
  }, [eventBus, stepIndex]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStepIndex((current) => (current + 1) % desktopSequence.length);
    }, 2600);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="desktop-preview min-h-screen overflow-hidden text-slate-50" data-testid="desktop-preview">
      <div className="desktop-preview-wallpaper" aria-hidden="true" />

      <section className="desktop-hub-stage" aria-label="Desktop status hub preview">
        <div className="desktop-hub-anchor">
          <div className="mb-3 flex items-center justify-between gap-3 px-2 text-xs text-slate-200/85">
            <span className="font-semibold tracking-normal">Cober Windows Bar</span>
            <span className="rounded-full border border-white/12 bg-white/[0.08] px-2 py-0.5">
              Mock desktop preview
            </span>
          </div>
          <HubShell
            mode={storeState.mode}
            tasks={storeState.tasks}
            music={storeState.music}
            notification={storeState.notification}
          />
        </div>
      </section>

      <div className="desktop-taskbar" aria-label="Mock Windows taskbar">
        <div className="flex items-center gap-2">
          <span className="desktop-start-mark" aria-hidden="true" />
          <span className="hidden rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs text-slate-300 sm:inline">
            Search mock apps
          </span>
        </div>

        <div className="flex items-center gap-1.5" aria-label="Mock status modes">
          <TaskbarIcon active={storeState.mode === "music"} label="Music mode"><Music2 size={16} /></TaskbarIcon>
          <TaskbarIcon active={storeState.mode === "aiProgress"} label="AI mode"><Bot size={16} /></TaskbarIcon>
          <TaskbarIcon active={storeState.mode === "download"} label="Download mode"><Download size={16} /></TaskbarIcon>
          <TaskbarIcon active={storeState.mode === "notification"} label="Notification mode"><Bell size={16} /></TaskbarIcon>
        </div>

        <div className="flex items-center gap-2 text-slate-100">
          <Wifi size={15} />
          <BatteryMedium size={16} />
          <div className="text-right text-[11px] leading-4">
            <div>16:20</div>
            <div>{modeLabel[storeState.mode]}</div>
          </div>
        </div>
      </div>
    </main>
  );
}

function TaskbarIcon({ active, children, label }: { active?: boolean; children: ReactNode; label: string }) {
  return (
    <div
      aria-label={label}
      className={`relative grid h-9 w-9 place-items-center rounded-[10px] border text-slate-100 transition ${
        active ? "border-sky-200/25 bg-sky-300/16 text-sky-100" : "border-white/8 bg-white/[0.055]"
      }`}
    >
      {children}
      {active && <span className="absolute bottom-1 h-0.5 w-4 rounded-full bg-[#60cdff]" />}
    </div>
  );
}
