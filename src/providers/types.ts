import type { HubEvent } from "../types/hub";

export type HubProviderStatus = "stopped" | "running" | "error";

export type HubProviderListener = (events: HubEvent[]) => void;

export type MockProviderOptions = {
  now?: number | (() => number);
};

export type HubProvider = {
  id: string;
  label: string;
  start(): void;
  stop(): void;
  subscribe(listener: HubProviderListener): () => void;
  getStatus(): HubProviderStatus;
};
