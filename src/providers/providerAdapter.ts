import type { HubEventBus } from "../state/hubState";
import type { HubProvider } from "./types";

export type ProviderConnection = {
  disconnect(): void;
};

export function connectProviderToEventBus(
  provider: HubProvider,
  eventBus: HubEventBus,
): ProviderConnection {
  const unsubscribe = provider.subscribe((events) => {
    for (const event of events) {
      eventBus.publishHubEvent(event);
    }
  });

  return {
    disconnect() {
      unsubscribe();
    },
  };
}
