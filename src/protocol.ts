// Message protocol between the extension backend and the webview frontend.
// Kept in one file so both sides compile against the same shapes.
// Data shapes mirror docs/cli-contract.md (the isopod --json contract).

export interface BoxSummary {
  name: string;
  status: string;
  ssh_host: string;
  port: number | null;
  color: string | null;
  engine: 'podman' | 'docker' | 'container' | string;
}

// `isopod info <name> --json` — the six shared box facts plus connection detail.
export interface BoxInfo extends BoxSummary {
  forwards: string[];
  secrets: string[]; // names only; values never leave the host store
  workspace: string;
}

// Which built-in Podman Desktop container page to deep-link into for a box.
export type ContainerView = 'details' | 'logs' | 'terminal' | 'inspect';

// `isopod secret ls --json` — the names-only secret index plus which boxes
// attach each name. Values never leave the host store, so none appear here.
export interface SecretEntry {
  name: string;
  boxes: string[];
}

export interface SecretIndex {
  backend: string;
  secrets: SecretEntry[];
}

export interface EgressProxyStatus {
  running: boolean;
  port: number;
}

export interface EgressStatus {
  mode: string;
  firewall: 'active' | 'inactive' | 'unknown' | string;
  network: string;
  subnet: string;
  dns: string;
  proxy: EgressProxyStatus | null;
}

// `isopod egress allowlist --json` — the layered allow-list: shipped `baseline`
// defaults vs `user` domains added via `egress allow`.
export interface EgressAllowlist {
  baseline: string[];
  user: string[];
}

// `isopod egress denied --json` — hostnames the proxy refused (needs root to
// read the proxy log; best-effort).
export interface EgressDenied {
  hostnames: string[];
}

// webview -> extension
export type UiRequest =
  | { kind: 'refresh'; } // re-fetch boxes + egress status
  | { kind: 'openInIde'; name: string; }
  | { kind: 'startBox'; name: string; }
  | { kind: 'stopBox'; name: string; }
  | { kind: 'boxInfo'; name: string; } // fetch full detail for one box
  | { kind: 'openContainerView'; name: string; view: ContainerView; } // deep-link into a built-in page
  | { kind: 'copyText'; text: string; } // copy to the host clipboard
  | { kind: 'egressLogStart'; }
  | { kind: 'egressLogStop'; }
  | { kind: 'egressAllow'; domain: string; }
  | { kind: 'egressAllowlist'; } // fetch baseline vs user allow-list
  | { kind: 'egressDenied'; } // fetch refused hostnames
  | { kind: 'secrets'; }; // fetch the names-only secret index

// extension -> webview
export type UiEvent =
  | { kind: 'boxes'; boxes: BoxSummary[]; }
  | { kind: 'boxInfo'; name: string; info: BoxInfo | null; error?: string; }
  | { kind: 'egressStatus'; status: EgressStatus | null; error?: string; }
  | { kind: 'egressAllowlist'; allowlist: EgressAllowlist | null; error?: string; }
  | { kind: 'egressDenied'; denied: EgressDenied | null; error?: string; }
  | { kind: 'egressLog'; lines: string[]; }
  | { kind: 'egressLogState'; running: boolean; }
  | { kind: 'secrets'; secrets: SecretIndex | null; error?: string; }
  | { kind: 'busy'; name: string; busy: boolean; }
  | { kind: 'error'; message: string; };
