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

// webview -> extension
export type UiRequest =
  | { kind: 'refresh' } // re-fetch boxes + egress status
  | { kind: 'openInIde'; name: string }
  | { kind: 'startBox'; name: string }
  | { kind: 'stopBox'; name: string }
  | { kind: 'egressLogStart' }
  | { kind: 'egressLogStop' }
  | { kind: 'egressAllow'; domain: string };

// extension -> webview
export type UiEvent =
  | { kind: 'boxes'; boxes: BoxSummary[] }
  | { kind: 'egressStatus'; status: EgressStatus | null; error?: string }
  | { kind: 'egressLog'; lines: string[] }
  | { kind: 'egressLogState'; running: boolean }
  | { kind: 'busy'; name: string; busy: boolean }
  | { kind: 'error'; message: string };
