# Test Strategy

## Scope

This document defines the v0.5.1 test strategy for the Mock Provider SDK implementation plan. It is documentation only: v0.5.1 does not add test code, provider code, runtime code, Tauri/Rust/IPC code, or Windows/system API implementation.

The categories below describe the minimum assertions future tests should cover. v0.6 may implement these tests and any supporting code after the provider runtime and SDK contracts are ready to exercise.

## Lifecycle Tests

Lifecycle tests should validate the expected provider state transitions and emitted lifecycle events.

Minimum assertions:

- A provider starts from an idle or stopped state and reaches a running state.
- A running provider can be stopped and reaches a stopped state.
- Start and stop operations emit the expected lifecycle notifications in order.
- Failed start attempts surface an error state without leaving the provider marked as running.
- Failed stop attempts preserve enough state for the caller to know whether cleanup is still required.
- Repeated lifecycle operations do not lose the provider identity, registration metadata, or subscription relationships.

## Registry Tests

Registry tests should validate provider registration, lookup, and removal behavior.

Minimum assertions:

- Registering a provider stores its id, display metadata, capability metadata, and initial lifecycle state.
- Looking up a registered provider by id returns the same logical provider record.
- Listing providers includes registered providers exactly once.
- Removing a registered provider makes it unavailable for lookup and list operations.
- Registry operations reject invalid or incomplete provider records.
- Registry state remains consistent when lifecycle operations update provider status.

## Cleanup Tests

Cleanup tests should validate that provider resources, subscriptions, and registry records are released when a provider stops or is removed.

Minimum assertions:

- Stopping a provider releases active mock timers, pending progress emitters, and queued notification work owned by that provider.
- Removing a provider clears its subscriptions and prevents future events from reaching removed subscribers.
- Cleanup is idempotent when called more than once for the same provider.
- Cleanup after a failed start does not throw because partially initialized resources are missing.
- Cleanup does not affect unrelated providers or subscribers.

## Duplicate Start Tests

Duplicate start tests should validate that the SDK handles concurrent or repeated start requests predictably.

Minimum assertions:

- Starting an already running provider does not create a second provider runtime instance.
- Concurrent start requests resolve to one running provider state.
- Duplicate starts do not duplicate subscriptions, notification timers, or progress emitters.
- The caller receives a stable result for duplicate start attempts, either by sharing the existing start result or returning a clear already-running outcome.
- Duplicate start handling emits no extra running notifications beyond the expected lifecycle sequence.

## Subscription Tests

Subscription tests should validate event subscription, event delivery, and unsubscription behavior.

Minimum assertions:

- Subscribers receive events for the provider or channel they subscribed to.
- Subscribers do not receive events from unrelated providers or channels.
- Multiple subscribers can receive the same event without mutating each other's delivery state.
- Unsubscribed listeners stop receiving future events.
- Subscription cleanup occurs when a provider is stopped or removed.
- Subscriber errors do not prevent delivery to other subscribers.

## Notification Expiry

Notification expiry tests should validate notification time-to-live behavior and removal from visible state.

Minimum assertions:

- Notifications with an expiry value remain visible until their expiry time is reached.
- Expired notifications are removed from the active notification list.
- Expiry cleanup does not remove non-expired notifications.
- Manual notification dismissal prevents later expiry work from reintroducing the notification.
- Provider cleanup cancels pending expiry work for notifications owned by that provider.

## Progress Sequence

Progress sequence tests should validate the order and completeness of progress updates emitted by mock provider operations.

Minimum assertions:

- Progress begins with an initial event that identifies the operation and provider.
- Progress values move forward monotonically for a single operation.
- The final progress event indicates completion, cancellation, or failure.
- Completion events are not emitted before required intermediate progress state.
- Failed operations stop emitting success progress after the failure event.
- Parallel operations keep progress identifiers distinct so events cannot be mixed between operations.

## Event Spam and Backpressure

Event spam and backpressure tests should validate that high-volume event streams remain bounded and observable.

Minimum assertions:

- Rapid provider event emission does not crash the registry, subscription dispatcher, or notification store.
- Event queues, buffers, or coalescing rules remain within documented bounds.
- Slow subscribers do not block lifecycle cleanup for the provider.
- Dropped, coalesced, or throttled events are observable through documented diagnostics or counters.
- Backpressure handling preserves terminal lifecycle and progress events.
- Event spam from one provider does not starve unrelated providers.

## v0.5.1 Non-Goals

v0.5.1 does not implement the tests described here. It also does not add test harnesses, mock provider runtime code, Tauri IPC tests, Rust tests, Windows API shims, or provider SDK implementation changes.

These assertions are intended to guide v0.6 test and implementation work once the Mock Provider SDK surfaces are stable enough to verify with executable tests.
