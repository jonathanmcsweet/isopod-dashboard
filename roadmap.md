# Isopod Dashboard — Roadmap

A Podman Desktop extension for managing [isopod](../isopod) AI-coding sandboxes.

## Guiding principles

- **The `isopod` CLI is the single source of truth.** The extension shells out;
  it never reimplements box, egress, or secret logic. All reads go through the
  `--json` contract in [docs/cli-contract.md](docs/cli-contract.md).
- **Extend, don't rebuild.** Podman Desktop already provides the generic layer
  (container list, logs, terminal, image management, stats). We only build the
  isopod-specific surface on top and deep-link into the built-ins.
- **Cross-engine by design.** Podman, Docker, and Apple `container` all appear
  through Podman Desktop; the dashboard treats them uniformly via the CLI.

## Architecture decision: extension, not standalone app

Settled. Podman Desktop's extension API covers everything on this roadmap,
including two things first assumed out of reach:

- Apple `container` visibility on macOS (official Apple Container extension +
  socktainer shim, macOS 26+ / Apple Silicon).
- Root-requiring egress operations, via `process.exec(..., { isAdmin: true })`.

A standalone tray utility remains a possible _additive_ later idea for users who
won't install Podman Desktop — not a reason to build the dashboard standalone.

---

## Phase 0 — Foundations (prerequisites)

| Item                                                      | Status      | Notes                                                                                      |
| --------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------ |
| `isopod --json` for `list`, `info`, `egress status`       | **Done**    | isopod branch `feat/json-output`, v2.9.0. Contract in docs/cli-contract.md.                |
| `io.isopod.box` label on `isopod create` containers       | **Pending** | Needed for the Containers-tab menu item and posture badge to key off. Small isopod change. |
| Non-interactive CLI flags (`--yes`) for wizard-driven ops | **Pending** | `process.exec` has no PTY; any op the wizard triggers must run non-interactively.          |

## Phase 1 — v1 (shipped, v0.1.0)

- **Boxes page** — custom webview: one row per box (status, name, SSH host,
  port, color chip, engine) with per-row Open / Start / Stop. Auto-refreshes on
  `containerEngine.onEvent` (debounced).
- **Open in VSCodium** — per-row action, plus a `dashboard/container` menu item
  on isopod containers in the stock Containers tab (gated on `io.isopod.box`).
- **Egress panel** — status card (mode, firewall state, network/subnet/DNS,
  proxy), "allow a domain" form (`isopod egress allow`), and a live proxy-log
  tail (`isopod egress log` streamed via `process.exec` + `CancellationToken`).

APIs used: `window.createWebviewPanel`, `navigation.register`/`navigateToWebview`,
`commands.registerCommand`, `containerEngine.onEvent`, `process.exec` (+ logger,
token), `contributes.menus`.

## Phase 2 — Depth on what exists

- **Security posture badge per box** — `contributes.views` →
  `icons/containersList` with a when-clause on box labels (tier 1/2/3, hardening
  profile, egress mode). Requires the `io.isopod.box` label + tier labels at
  create time. _(Feature 3)_
- **Egress panel v2** — separate blocked-request feed from the raw log; show
  baseline vs. user allow-list with diff; per-box egress attribution. _(Feature 2 cont.)_
- **Box detail view** — click a box → full `isopod info` (forwards, secrets
  names, workspace), copyable SSH destination for non-VSCodium IDEs, deep-links
  to the built-in container logs/terminal/inspect via `navigation.navigateTo*`.

## Phase 3 — Lifecycle operations

- **Create wizard** — `FormPage` over `isopod create` flags (repo/allowlist
  folders via `showOpenDialog`, color, memory, hardening, egress mode), run
  under `window.withProgress`. _(Feature 4)_
- **Get-work-out view** — show what changed in the box workspace; buttons for
  `fetch` vs `export`; preview what `remap` would rewrite in the git log.
  _(Feature 6)_
- **Doctor + GC** — render `isopod doctor` as checks with fix hints; show
  reclaimable disk (stale boxes, dangling images from `containerEngine.info` /
  `listImages`) with one-click `gc`. _(Feature 7)_
- **Secrets panel** — names-only index, backend in use, which boxes have each
  secret attached (via `isopod secret`; not engine secrets). _(Feature 8)_

## Phase 4 — Platform integration (API bonuses)

- **`cli.createCliTool()`** — register `isopod` on the CLI Tools page with
  version detection and managed install/update; could replace `install.sh` for
  GUI users.
- **Onboarding workflow** — guided first run: check engine → install isopod →
  run doctor.
- **`configuration` contribution** — isopod defaults (base image, memory,
  egress mode) as native settings fields.
- **Egress apply from the UI** — `process.exec(..., { isAdmin: true })` to run
  `egress apply` / `persist` behind the OS elevation prompt (currently the panel
  only displays the command).
- **Tray quick-launch** — `tray.registerMenuItem()` for two-click box start.

## Phase 5 — Distribution

- Package for the Podman Desktop extension catalog (deferred until the above is
  proven locally).
- CI: build + typecheck + test on push; mirror isopod's conventional-commit and
  version-bump discipline.

---

## Explicitly out of scope (use the built-ins)

Log viewers, in-container terminals, image lists, CPU/memory graphs — Podman
Desktop's native versions are sufficient; the dashboard deep-links to them
rather than reimplementing.

## Known constraints

- The webview is DIY UI (HTML sandbox + message passing); `@podman-desktop/ui-svelte`
  makes it look native but every custom page is real build cost.
- Built-in pages expose only two hooks: row menu items (`dashboard/container`)
  and status icons (`icons/containersList`) — no extra columns, filtering, or
  grouping. The box-centric list must be our own page.
- When-clauses are label-based and coarse — fine for static create-time facts,
  not for dynamic per-row host state (e.g. live egress rule status).
- Apple `container` integration needs macOS 26+ / Apple Silicon; the CLI remains
  the fallback below that.
- Some egress reads need root; the panel surfaces the error and the command to
  run rather than failing silently.
