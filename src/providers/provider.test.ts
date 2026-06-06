import { strict as assert } from "node:assert";
import { createHubEventBus } from "../state/hubState";
import type { HubMode } from "../types/hub";
import {
  createMockAiTaskProvider,
  createMockDownloadProvider,
  createMockMusicProvider,
  createMockNotificationProvider,
} from "./mockProviders";
import { connectProviderToEventBus } from "./providerAdapter";
import type { HubProvider } from "./types";

const now = Date.UTC(2026, 5, 6, 11, 0, 0);

function test(name: string, run: () => void) {
  run();
  console.log(`ok ${name}`);
}

function collectModes(provider: HubProvider): HubMode[] {
  const bus = createHubEventBus();
  const modes: HubMode[] = [];
  const unsubscribe = bus.subscribe((state) => modes.push(state.mode));
  const connection = connectProviderToEventBus(provider, bus);

  provider.start();

  connection.disconnect();
  unsubscribe();

  return modes;
}

test("adapter publishes music provider events through the event bus", () => {
  const modes = collectModes(createMockMusicProvider({ now }));

  assert.deepEqual(modes, ["idle", "music"]);
});

test("adapter publishes AI task provider events through the event bus", () => {
  const modes = collectModes(createMockAiTaskProvider({ now }));

  assert.deepEqual(modes, ["idle", "aiProgress"]);
});

test("adapter publishes download provider events through the event bus", () => {
  const modes = collectModes(createMockDownloadProvider({ now }));

  assert.deepEqual(modes, ["idle", "download"]);
});

test("adapter preserves notification expiry behavior", () => {
  const bus = createHubEventBus();
  const provider = createMockNotificationProvider({ now });
  const connection = connectProviderToEventBus(provider, bus);

  provider.start();

  assert.equal(bus.getState(now).mode, "notification");
  assert.equal(bus.getState(now + 4000).mode, "idle");

  connection.disconnect();
});

test("disconnect stops forwarding provider emissions", () => {
  const bus = createHubEventBus();
  const provider = createMockMusicProvider({ now });
  const connection = connectProviderToEventBus(provider, bus);

  connection.disconnect();
  provider.start();

  assert.equal(bus.getState(now).mode, "idle");
});
