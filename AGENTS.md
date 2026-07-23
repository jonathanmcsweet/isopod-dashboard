# AGENTS.md — guidance for AI agents working in isopod-dashboard

A Podman Desktop extension (TypeScript backend + Svelte 5 webview) that manages
[isopod](../isopod) sandboxes. See [roadmap.md](roadmap.md) for direction and
[README.md](README.md) for a feature/dev overview.

## Core principle

The `isopod` CLI is the single source of truth. This extension shells out to it;
it does NOT reimplement box, egress, or secret logic. All structured reads go
through the JSON contract in [docs/cli-contract.md](docs/cli-contract.md). If a
new UI feature needs data the CLI doesn't expose as JSON, add `--json` to isopod
first (extend the contract), then consume it here — do not scrape human-facing
output or read isopod's on-disk state directly.

## Commands

- `pnpm install` — deps (pnpm; `pnpm-workspace.yaml` allows the esbuild build).
- `pnpm build` — backend (`dist/extension.cjs`) then webview (`dist/webview/`).
- `pnpm typecheck` — `tsc --noEmit` + `svelte-check`. Keep it at 0 errors.
- `pnpm test` — vitest unit tests (`src/**/*.spec.ts`).

Run all three green before committing.

## Layout

- `src/` — extension backend, loaded by Podman Desktop.
  - `src/extension.ts` — `activate()`/`deactivate()`, command + webview wiring.
  - `src/isopod-cli.ts` — the only place that spawns `isopod`.
  - `src/protocol.ts` — message + data types SHARED by backend and webview.
    Data shapes here must mirror docs/cli-contract.md.
- `frontend/` — the webview page (Svelte 5 runes + `@podman-desktop/ui-svelte`
  + Tailwind 4). Talks to the backend only via `postMessage` (see
  `frontend/src/api.ts`).
- `docs/cli-contract.md` — the isopod `--json` contract this extension depends on.

## Conventions

- **Commits:** Conventional Commits (`feat`, `fix`, `docs`, `refactor`, `chore`,
  …), imperative lowercase subject, no trailing period. End the message with a
  `Co-Authored-By:` trailer naming the AI model used. Mirrors the isopod repo.
- **Versioning:** bump `version` in `package.json` per SemVer when finishing a
  branch of work.
- **UI components:** prefer `@podman-desktop/ui-svelte` (Table, NavPage, Button,
  Input, EmptyScreen, …) over hand-rolled markup so the page matches the native
  look. Style with the `--pd-*` CSS variables Podman Desktop injects; never
  hard-code theme colors.
- **Backend/webview boundary:** all cross-boundary traffic is typed in
  `protocol.ts`. Add a `UiRequest`/`UiEvent` variant rather than passing ad-hoc
  objects.

## Build quirks (do not "fix" without understanding)

- The backend builds in Vite **SSR mode** (`ssr.noExternal: true`) so node
  builtins resolve and everything except `@podman-desktop/api` bundles into one
  CJS file. `@podman-desktop/api` is externalized — it's provided by the host.
- **vitest config is separate** (`vitest.config.ts`), because the build's
  `ssr.noExternal` breaks vitest's own runtime if shared.
- `@podman-desktop/api` is **types-only** (no runtime entry). Tests alias it to
  `src/__mocks__/podman-desktop-api.ts`; that stub must stay free of `vitest`
  imports (importing vitest there spawns a second instance and breaks suites).
- The frontend Vite config is `frontend/vite.config.mts` (ESM) and
  `frontend/svelte.config.js` sits beside the Svelte sources so `svelte-check`
  finds it.

## When editing the CLI boundary

If you change what the extension expects from isopod, update BOTH
docs/cli-contract.md and `src/protocol.ts`, and coordinate the matching isopod
change on its side. The contract is additive-only; renaming/removing a field is
a breaking change flagged in both repos.
