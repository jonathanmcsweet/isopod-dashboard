# isopod CLI JSON contract

The dashboard extension consumes these commands. Fields listed are required;
emitters may add fields, consumers must ignore unknown fields. All output is a
single JSON document on stdout, no trailing prose. Errors still exit non-zero
with a human message on stderr.

## `isopod list --json`

Array (possibly empty) of box summaries:

```json
[
  {
    "name": "mybox",
    "status": "running",
    "ssh_host": "isopod-mybox",
    "port": 4222,
    "color": "teal",
    "engine": "podman"
  }
]
```

- `status`: the same values `box_status` produces today (`running`, `exited`,
  `created`, `missing`, …), passed through verbatim.
- `port`: integer, or `null` when unknown.
- `color`: string, or `null` when unset.
- `engine`: `podman` | `docker` | `container` (per-box engine, as `box_engine`).

## `isopod info <name> --json`

Object for one box — the same facts `info.txt` renders:

```json
{
  "name": "mybox",
  "status": "running",
  "ssh_host": "isopod-mybox",
  "port": 4222,
  "color": "teal",
  "engine": "podman",
  "forwards": ["8080:8080"],
  "secrets": ["ANTHROPIC_API_KEY"],
  "workspace": "/home/dev/workspace"
}
```

- `forwards` and `secrets`: arrays, empty when none (never placeholder prose).
- Secret _names_ only — values never leave the host store.

## `isopod egress status --json`

Object mirroring the fields `egress-status.txt` renders:

```json
{
  "mode": "allow-list",
  "firewall": "active",
  "network": "isopod0",
  "subnet": "10.88.7.0/24",
  "dns": "1.1.1.1",
  "proxy": { "running": true, "port": 8118 }
}
```

- `firewall`: `active` | `inactive` | `unknown` (unknown = need root to read).
- `proxy`: `null` when allow-list mode is not configured.

## `isopod egress allowlist --json`

Object with the layered allow-list — the shipped `baseline` defaults vs the
`user` domains added through `isopod egress allow`:

```json
{
  "baseline": ["github.com", "*.anthropic.com"],
  "user": ["example.com"]
}
```

- Both arrays are the raw domain tokens (a `*.` prefix means subdomains only),
  empty when the corresponding file has no entries.

## `isopod egress denied --json`

Object listing hostnames the filtering proxy refused (best-effort; parsed from
the proxy log, which needs root to read — errors exit non-zero as usual):

```json
{
  "hostnames": ["tracker.evil.net", "ads.example.com"]
}
```

## `isopod secret ls --json`

Object with the active storage `backend` and the managed secret names (never
values), each with the boxes whose meta attaches it:

```json
{
  "backend": "keychain-linux",
  "secrets": [
    { "name": "ANTHROPIC_API_KEY", "boxes": ["mybox", "other"] },
    { "name": "GITHUB_TOKEN", "boxes": [] }
  ]
}
```

- `backend`: `keychain-macos` | `keychain-linux` | `file` (per `secret_backend`).
- `boxes`: box names attaching the secret, empty when none.
- Secret _values_ never appear — names only.

## `isopod doctor --json`

A machine-readable health summary — a subset of the human `doctor` narrative,
covering the actionable prerequisite checks:

```json
{
  "version": "2.12.0",
  "checks": [
    { "level": "ok", "id": "ssh-tools", "label": "SSH client tools", "hint": "" },
    {
      "level": "warn",
      "id": "hardening",
      "label": "hardening profile",
      "hint": "missing — boxes start without fingerprint masks"
    }
  ]
}
```

- `level`: `ok` | `warn` | `error` | `na` (na = not applicable / absent).
- `id`: stable slug; `label`/`hint`: human text (`hint` empty when none).
- The long platform/virtualization advisories stay text-only in `isopod doctor`.

## `isopod gc --json`

Object listing the unreferenced isopod images `gc` would reclaim. Read-only —
`--json` never removes anything (run `isopod gc --force` to reclaim):

```json
{ "images": ["localhost/isopod-base:v1", "localhost/isopod-box-abc:v1"] }
```

## `isopod create <name> [flags]`

Not a `--json` reader — the create wizard invokes `create` directly. It is
fully flag-driven and non-interactive (no prompts, no PTY needed), so
`process.exec` can run it. Flags the wizard sets: `--repo` (repeatable),
`--color`, `--memory`, `--cpus`, `--engine`, `--harden` (`default`|`off`),
`--dev`, `--no-sudo`. Success/failure is taken from the exit code.

## Versioning

The contract is additive-only. Removing or renaming a field is a breaking
change to the extension and requires a major-version note in both repos.
