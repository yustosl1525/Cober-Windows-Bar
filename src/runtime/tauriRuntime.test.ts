import { strict as assert } from "node:assert";
import {
  getTauriInvoke,
  loadTauriFixtureHubEvents,
  TAURI_FIXTURE_COMMAND,
  type TauriInvoke,
} from "./tauriRuntime";

const tests: Array<{ name: string; run: () => void | Promise<void> }> = [];

function test(name: string, run: () => void | Promise<void>) {
  tests.push({ name, run });
}

test("detects unavailable Tauri invoke", async () => {
  const result = await loadTauriFixtureHubEvents();

  assert.equal(result.ok, false);
  assert.equal(result.diagnostic.code, "unavailable");
});

test("finds global Tauri core invoke when present", () => {
  const invoke: TauriInvoke = async () => [];

  assert.equal(getTauriInvoke({ __TAURI__: { core: { invoke } } }), invoke);
});

test("returns malformed diagnostic for non-canonical fixture payloads", async () => {
  const result = await loadTauriFixtureHubEvents({
    invoke: async () => [
      {
        id: "bad",
        type: "unknown",
        source: "mock",
        createdAt: Date.now(),
      },
    ],
  });

  assert.equal(result.ok, false);
  assert.equal(result.diagnostic.code, "malformed");
});

test("returns invoke-failed diagnostic when command rejects", async () => {
  const result = await loadTauriFixtureHubEvents({
    invoke: async () => {
      throw new Error("native boundary failed");
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.diagnostic.code, "invoke-failed");
  assert.equal(result.diagnostic.detail, "native boundary failed");
});

test("loads canonical fixture events through the configured command", async () => {
  const calls: string[] = [];
  const result = await loadTauriFixtureHubEvents({
    invoke: async (command) => {
      calls.push(command);
      return [
        {
          id: "tauri-fixture-ai",
          type: "ai",
          source: "mock",
          createdAt: 1780743600000,
          progress: 64,
          payload: {
            id: "tauri-fixture-ai-task",
            type: "ai",
            title: "Tauri IPC fixture",
            subtitle: "Boundary smoke event from native fixture command",
            progress: 64,
            accent: "blue",
          },
          metadata: {
            runtime: "tauri",
            fixture: true,
          },
        },
      ];
    },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(calls, [TAURI_FIXTURE_COMMAND]);

  if (result.ok) {
    assert.equal(result.events[0]?.type, "ai");
    assert.equal(result.events[0]?.source, "mock");
    assert.equal(result.events[0]?.metadata?.runtime, "tauri");
  }
});

for (const { name, run } of tests) {
  try {
    await run();
    console.log(`ok ${name}`);
  } catch (error) {
    console.error(`not ok ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}
