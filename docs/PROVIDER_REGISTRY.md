# Provider Registry Planning

Status: v0.5.0 planning-only. This document describes the intended provider registry shape for the Mock Provider SDK. It does not define implemented behavior, runtime wiring, IPC, Tauri commands, Windows APIs, or concrete mock providers.

## Purpose

The provider registry is the planned coordination layer for discovering, storing, querying, and lifecycle-controlling providers exposed through the Mock Provider SDK. It is intended to give the app a single conceptual place to ask which providers exist, what they can do, and whether they should be running.

The registry is a local SDK concept. It should remain independent from platform integration details so future provider implementations can be mocked, simulated, or replaced without changing registry semantics.

## Responsibilities

- Store registered provider records by stable provider id.
- Expose provider metadata, capabilities, privacy declarations, and runtime state.
- Provide lookup and listing APIs for UI, orchestration, and tests.
- Coordinate conceptual lifecycle transitions such as start, stop, pause, and resume.
- Support bulk lifecycle operations across all registered providers.
- Detect duplicate provider ids and apply a deterministic conflict policy.
- Group providers by broad product area so callers can filter by domain.
- Keep enough state for mock providers to model provider availability without requiring real system integration.

## Non-Responsibilities

- Implement provider behavior such as music playback, AI responses, download management, or notification delivery.
- Create MockMusicProvider, MockAIProvider, MockDownloadProvider, or MockNotificationProvider.
- Call Tauri, Rust, IPC, Windows, shell, network, file-system, or system-tray APIs.
- Persist providers across app launches.
- Own user authentication, secret storage, permission prompts, or account linking.
- Decide final production provider contracts beyond the v0.5.0 planning scope.
- Replace domain-specific provider logic; providers still own their own behavior.

## Conceptual API

These names describe the planning surface only. v0.5.0 should not add implementation code for them.

### `register(provider)`

Adds a provider record to the registry.

Expected planning behavior:

- Validate that the provider has a stable id, group, metadata, capabilities, privacy fields, and runtime fields.
- Reject or resolve duplicate ids according to the duplicate id policy.
- Make the provider visible through `get` and `list` after successful registration.

### `unregister(providerId)`

Removes a provider record from the registry.

Expected planning behavior:

- Stop or mark inactive any provider that is currently running before removal.
- Remove the provider from lookup and list results.
- Treat unknown ids as a no-op or typed result, depending on the final SDK error model.

### `get(providerId)`

Returns one registered provider record by id.

Expected planning behavior:

- Return the provider record when found.
- Return an empty result, typed error, or nullable value when not found; the final shape is deferred.

### `list(filter?)`

Returns registered provider records.

Expected planning behavior:

- Support listing all providers.
- Support filtering by group, capability, privacy attribute, availability, and runtime status.
- Preserve deterministic ordering, likely by group and display name or by registration order.

### `start(providerId)`

Requests that one provider enter a running state.

Expected planning behavior:

- Validate that the provider is registered.
- Transition eligible providers from `stopped` or `paused` into `running`.
- Surface unsupported, unavailable, or failed starts through typed results in the future SDK.

### `stop(providerId)`

Requests that one provider enter a stopped state.

Expected planning behavior:

- Validate that the provider is registered.
- Transition running or paused providers to `stopped`.
- Allow repeated stop calls to be idempotent.

### `pause(providerId)`

Requests that one provider temporarily suspend active work.

Expected planning behavior:

- Validate that the provider is registered and supports pause.
- Transition eligible running providers to `paused`.
- Leave unsupported providers unchanged and report the unsupported operation through the future result model.

### `resume(providerId)`

Requests that one paused provider continue active work.

Expected planning behavior:

- Validate that the provider is registered.
- Transition eligible paused providers to `running`.
- Treat resume on stopped or unavailable providers as a typed no-op or error, to be finalized later.

### `startAll(filter?)`

Requests that every matching provider start.

Expected planning behavior:

- Apply optional group or capability filters before starting.
- Return per-provider results rather than failing the whole operation on the first error.
- Avoid starting providers marked disabled, unavailable, or incompatible.

### `stopAll(filter?)`

Requests that every matching provider stop.

Expected planning behavior:

- Apply optional group or capability filters before stopping.
- Return per-provider results.
- Be safe to call repeatedly.

## Provider Record Shape

Provider records should be explicit enough for UI and tests to reason about provider identity, supported behavior, privacy posture, and current runtime status.

### Metadata Fields

- `id`: Stable unique provider identifier, such as `mock.music.local`.
- `group`: Provider group, such as `music`, `ai`, `download`, or `notification`.
- `name`: Human-readable display name.
- `description`: Short provider summary for settings and debugging surfaces.
- `version`: Provider contract or mock implementation version.
- `author`: Optional provider author, package, or owning team.
- `homepage`: Optional documentation or product URL.
- `tags`: Optional labels for search and filtering.

### Capability Fields

- `capabilities`: Stable capability ids exposed by the provider.
- `features`: Optional feature flags or named behaviors within a capability.
- `commands`: Optional high-level command ids the provider can conceptually handle.
- `events`: Optional event ids the provider can conceptually emit.
- `supportsPause`: Whether `pause` and `resume` should be offered.
- `supportsBulkLifecycle`: Whether the provider can participate in `startAll` and `stopAll`.

Example capability areas:

- Music: playback, queue, library, now-playing state, volume.
- AI: chat, completion, embedding, summarization, tool-call simulation.
- Download: enqueue, progress, pause, resume, cancel, history.
- Notification: send, schedule, dismiss, action handling.

### Privacy Fields

- `dataAccess`: Declared categories of data the provider may read.
- `dataWrites`: Declared categories of data the provider may create or modify.
- `networkAccess`: Whether the provider expects network access; mock providers should normally declare no real network use.
- `localStorage`: Whether the provider expects local persistence.
- `sensitiveData`: Whether credentials, personal data, or private content may be involved.
- `privacyNotes`: Human-readable clarification for review and settings surfaces.

Privacy fields are declarations, not enforcement, in the v0.5.0 planning model.

### Runtime Fields

- `status`: Conceptual lifecycle state, such as `stopped`, `starting`, `running`, `pausing`, `paused`, `stopping`, `failed`, or `unavailable`.
- `enabled`: Whether the provider is allowed to participate in lifecycle operations.
- `available`: Whether the provider can currently run in the active environment.
- `lastStartedAt`: Optional timestamp for the most recent successful start.
- `lastStoppedAt`: Optional timestamp for the most recent stop.
- `lastError`: Optional structured error summary.
- `health`: Optional health value such as `unknown`, `ok`, `degraded`, or `failed`.

Runtime fields are intended for mockable state transitions. They should not imply real process, service, or OS lifecycle management in v0.5.0.

## Duplicate Id Handling

Provider ids must be unique within one registry instance. Duplicate id handling should be deterministic so tests and future UI behavior are predictable.

Planned policy:

- `register` should detect when the incoming provider id already exists.
- The default behavior should reject the duplicate and preserve the existing provider unchanged.
- The rejected result should identify the conflicting id and existing provider metadata.
- Replacement should require an explicit future option, such as `replace: true`, rather than happening implicitly.
- Duplicate ids across different groups should still conflict; the id is globally unique, not group-scoped.

This keeps accidental collisions visible and avoids silently changing provider behavior at runtime.

## Provider Groups

Groups are broad registry categories used for filtering, settings organization, and bulk operations. A provider belongs to one primary group.

### v0.5.0 Planning Groups

- `music`: Providers that model playback, queues, libraries, now-playing state, and audio-adjacent controls.
- `ai`: Providers that model chat, generation, summarization, embeddings, tool use, or agent-facing model behavior.
- `download`: Providers that model download queues, progress, pausing, resuming, cancellation, and history.
- `notification`: Providers that model notifications, scheduling, dismissal, actions, and delivery status.

### Future Groups

- `system`: Providers that may eventually model OS or device-adjacent capabilities.
- `developer`: Providers that may eventually model build, test, diagnostics, source control, or developer workflow capabilities.
- `agent`: Providers that may eventually model autonomous task runners, planning agents, orchestration, or background assistants.

Future groups are placeholders only. They do not grant permission to add system, developer, agent, Tauri, Rust, IPC, Windows, or background-process implementation in v0.5.0.

## Planning Boundary

For v0.5.0, this registry remains documentation and planning content only.

No code should be added for:

- Registry classes, stores, hooks, commands, or state containers.
- Mock provider implementations.
- Tauri commands, Rust structs, IPC channels, Windows integrations, or background services.
- Package scripts, dependency changes, assets, or generated files.

The next implementation step, after planning approval, should be a narrow SDK design pass that turns this document into typed contracts and tests without crossing into platform integration.
