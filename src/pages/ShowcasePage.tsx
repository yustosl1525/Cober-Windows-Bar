import { useEffect, useState } from "react";
import { HubShell } from "../components/hub/HubShell";
import { FluentStyleGuide } from "../components/showcase/FluentStyleGuide";
import { ModeSidebar } from "../components/showcase/ModeSidebar";
import { StatusFlow } from "../components/showcase/StatusFlow";
import { TaskbarFusionDemo } from "../components/showcase/TaskbarFusionDemo";
import type { HubMode } from "../types/hub";

export function ShowcasePage() {
  const [activeMode, setActiveMode] = useState<HubMode>("idle");

  useEffect(() => {
    if (activeMode !== "notification") {
      return;
    }

    const timer = window.setTimeout(() => setActiveMode("idle"), 3000);
    return () => window.clearTimeout(timer);
  }, [activeMode]);

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
            <ModeSidebar activeMode={activeMode} onModeChange={setActiveMode} />

            <div className="min-w-0 space-y-6">
              <section className="showcase-preview-panel flex min-h-[218px] items-center justify-center p-6 sm:p-8">
                <div className="text-center">
                  <div className="mb-7 text-sm font-semibold text-sky-200">Phase 0 UI Review / Current floating bar preview</div>
                  <HubShell mode={activeMode} />
                </div>
              </section>

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
