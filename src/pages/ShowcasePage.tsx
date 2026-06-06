import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HubShell } from "../components/hub/HubShell";
import { EventPlaygroundPanel } from "../components/showcase/EventPlaygroundPanel";
import { FluentStyleGuide } from "../components/showcase/FluentStyleGuide";
import { ModeSidebar } from "../components/showcase/ModeSidebar";
import { StatusFlow } from "../components/showcase/StatusFlow";
import { TaskbarFusionDemo } from "../components/showcase/TaskbarFusionDemo";
import {
  createAutoDemoSequence,
  createHubDemoScenario,
  playHubDemoScenario,
  type HubDemoScenarioId,
} from "../state/hubScenarios";
import { createHubEventBus } from "../state/hubState";
import type { HubMode, HubStoreState } from "../types/hub";

export function ShowcasePage() {
  const eventBus = useMemo(() => createHubEventBus(), []);
  const [storeState, setStoreState] = useState<HubStoreState>(() => eventBus.getState());
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const demoTimers = useRef<number[]>([]);
  const activeMode = storeState.mode;

  const clearDemoTimers = useCallback(() => {
    demoTimers.current.forEach((timer) => window.clearTimeout(timer));
    demoTimers.current = [];
  }, []);

  const playScenario = useCallback(
    (id: HubDemoScenarioId) => {
      clearDemoTimers();
      setIsAutoRunning(false);
      playHubDemoScenario(eventBus, createHubDemoScenario(id, Date.now()), Date.now());
    },
    [clearDemoTimers, eventBus],
  );

  const handleModeChange = useCallback(
    (mode: HubMode) => {
      const scenarioByMode: Record<HubMode, HubDemoScenarioId> = {
        idle: "idle",
        music: "music",
        aiProgress: "ai",
        download: "download",
        notification: "notification",
        multiTask: "multiTask",
      };

      playScenario(scenarioByMode[mode]);
    },
    [playScenario],
  );

  const startAutoDemo = useCallback(() => {
    clearDemoTimers();
    setIsAutoRunning(true);

    let delay = 0;
    const sequence = createAutoDemoSequence(Date.now());

    sequence.forEach((step, index) => {
      const timer = window.setTimeout(() => {
        playHubDemoScenario(eventBus, createHubDemoScenario(step.id, Date.now()), Date.now());

        if (index === sequence.length - 1) {
          setIsAutoRunning(false);
          demoTimers.current = [];
        }
      }, delay);

      demoTimers.current.push(timer);
      delay += step.durationMs;
    });
  }, [clearDemoTimers, eventBus]);

  useEffect(() => {
    return eventBus.subscribe(setStoreState);
  }, [eventBus]);

  useEffect(() => {
    const nextExpiresAt = storeState.events.reduce<number | undefined>((next, event) => {
      if (event.expiresAt === undefined) {
        return next;
      }

      return next === undefined ? event.expiresAt : Math.min(next, event.expiresAt);
    }, undefined);

    if (nextExpiresAt === undefined) {
      return;
    }

    const timer = window.setTimeout(
      () => eventBus.clearExpiredEvents(Date.now()),
      Math.max(0, nextExpiresAt - Date.now() + 24),
    );

    return () => window.clearTimeout(timer);
  }, [eventBus, storeState.events]);

  useEffect(() => {
    return () => clearDemoTimers();
  }, [clearDemoTimers]);

  return (
    <main className="showcase-desktop relative min-h-screen overflow-x-hidden text-slate-50">
      <div className="showcase-wallpaper" aria-hidden="true" />
      <div className="showcase-wallpaper-grain" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1800px] flex-col px-4 py-4 sm:px-6 sm:py-6 xl:px-8">
        <div className="showcase-window flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden sm:min-h-[calc(100vh-3rem)]">
          <div className="showcase-titlebar">
            <div className="flex min-w-0 items-center gap-3">
              <span className="showcase-app-icon" aria-hidden="true" />
              <span className="truncate text-[13px] font-medium text-slate-200">Cober Showcase</span>
            </div>
            <div className="flex items-center" aria-hidden="true">
              <span className="showcase-window-control" />
              <span className="showcase-window-control" />
              <span className="showcase-window-control showcase-window-control-close" />
            </div>
          </div>

          <div className="grid flex-1 gap-6 p-4 sm:p-5 lg:grid-cols-[340px_minmax(0,1fr)] lg:p-6 2xl:grid-cols-[392px_minmax(0,1fr)]">
            <ModeSidebar activeMode={activeMode} onModeChange={handleModeChange} />

            <div className="min-w-0 space-y-6">
              <section className="showcase-preview-panel flex min-h-[218px] items-center justify-center p-6 sm:p-8">
                <div className="text-center">
                  <div className="mb-7 text-sm font-semibold text-sky-200">v0.2 Interactive Event Playground / Resolved floating bar preview</div>
                  <HubShell mode={activeMode} />
                </div>
              </section>

              <EventPlaygroundPanel
                activeEvents={storeState.events}
                currentMode={activeMode}
                isAutoRunning={isAutoRunning}
                onMusic={() => playScenario("music")}
                onAi={() => playScenario("ai")}
                onDownload={() => playScenario("download")}
                onNotification={() => playScenario("notification")}
                onMultiTask={() => playScenario("multiTask")}
                onClear={() => playScenario("idle")}
                onStartDemo={startAutoDemo}
              />

              <StatusFlow activeMode={activeMode} />
              <TaskbarFusionDemo />
              <FluentStyleGuide />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
