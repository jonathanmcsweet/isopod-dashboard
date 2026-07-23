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
- Secret *names* only — values never leave the host store.

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

## Versioning

The contract is additive-only. Removing or renaming a field is a breaking
change to the extension and requires a major-version note in both repos.
