# Isopod Dashboard

A [Podman Desktop](https://podman-desktop.io) extension for managing
[isopod](https://github.com/jonathanmcsweet/isopod) AI-coding sandboxes.

## Features (v1)

- **Boxes page** — every isopod box with status, SSH host, port, window color,
  and engine; start, stop, and open a box in VSCodium from the row.
- **Container menu action** — "Open in VSCodium" on isopod containers in the
  stock Containers tab (requires boxes labeled `io.isopod.box`).
- **Egress panel** — current egress mode and firewall state, add a domain to
  the allow-list, and live-tail the egress proxy access log to watch what the
  agent inside a box tried to reach.

The extension is a thin UI over the `isopod` CLI: every operation shells out;
no isopod logic is reimplemented. Data flows through the JSON contract in
[docs/cli-contract.md](docs/cli-contract.md) (requires isopod >= 2.9 with
`--json` support).

## Requirements

- Podman Desktop >= 1.10
- `isopod` >= 2.9 on PATH (with `--json` output)

## Install

In Podman Desktop, go to **Extensions > Install custom extension from OCI image**
and enter:

```
ghcr.io/jonathanmcsweet/isopod-dashboard:latest
```

Pin a specific version by replacing `latest` with a released tag (e.g.
`:0.8.3`). The extension then appears on the **Extensions** page and adds the
**Isopod** entry to the left sidebar. See [Requirements](#requirements) above —
the `isopod` CLI must be on your PATH for box and egress reads to work.

Each release is published from a `v<version>` git tag by
[the release workflow](.github/workflows/release.yml).

## Development

### Prerequisites

- [pnpm](https://pnpm.io) (the repo pins its package manager / build allowlist in
  `pnpm-workspace.yaml`)
- Podman Desktop >= 1.10 (to load and run the extension)
- `isopod` >= 2.9 on PATH — the extension shells out to it; without it the UI
  loads but every box/egress read fails.

### Install and build

```sh
pnpm install     # deps + git hooks
pnpm build       # backend (dist/extension.cjs) + webview (dist/webview/)
```

### Load into Podman Desktop

1. Run `pnpm build` so `dist/` exists (`package.json` is the manifest,
   `dist/extension.cjs` the entrypoint).
2. Enable developer mode: **Preferences > Extensions > Development Mode**. Local
   extensions cannot be loaded until this is on.
3. **Extensions > Install custom extension from a folder**, pointing at this repo
   root. Confirm it appears and is enabled on the **Extensions** page — the
   command and sidebar entry below exist only once it activates.
4. Open the dashboard either way:
   - press **F1** to open the command palette and run **"Isopod: Open
     dashboard"**, or
   - click the **Isopod** icon in the left navigation sidebar.

If neither shows up, the extension didn't activate — check the **Extensions**
page and the dev console (**View > Toggle Developer Tools**) for errors. To
iterate, run `pnpm watch` and reload the extension from the **Extensions** page.

### Test and verify

Run these green before committing:

```sh
pnpm typecheck     # tsc --noEmit + svelte-check (keep at 0 errors)
pnpm test          # vitest unit tests (src/**/*.spec.ts)
pnpm lint          # Biome lint (lint:fix applies safe fixes)
pnpm format:check  # dprint (format applies)
```

Tests run against a stubbed `@podman-desktop/api`, so they need neither a running
Podman Desktop nor isopod. To exercise the real CLI path, create a box with
isopod, then confirm it appears on the **Boxes** page and that start/stop and
**Open in VSCodium** work from the row.

## Layout

- `src/` — extension backend (loaded by Podman Desktop; talks to the CLI and
  the container engine API)
- `src/protocol.ts` — message types shared between backend and webview
- `frontend/` — the webview page (Svelte 5 + @podman-desktop/ui-svelte +
  Tailwind 4)
- `docs/cli-contract.md` — the isopod `--json` output contract

## Known limitations

- `isopod egress log` may need root to read the proxy log; the tail surfaces
  the error in the panel if so.
- Applying egress rules (`isopod egress apply`) is not done from the UI; the
  panel tells you the command to run.
- The Containers-tab menu item only appears on boxes carrying the
  `io.isopod.box` label (isopod adds it at create time in versions that ship
  it; older boxes need recreation).

## License

Apache-2.0
