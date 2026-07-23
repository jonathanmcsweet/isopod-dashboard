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

## Development

```sh
pnpm install
pnpm build       # backend (dist/extension.cjs) + webview (dist/webview/)
pnpm typecheck   # tsc + svelte-check
pnpm test        # vitest unit tests
```

To try it: Podman Desktop > Extensions > Install custom extension from a
folder, pointing at this repo after `pnpm build` (the manifest is
`package.json`, entrypoint `dist/extension.cjs`). Then run the command
"Isopod: Open dashboard" or use the left-navigation entry.

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
