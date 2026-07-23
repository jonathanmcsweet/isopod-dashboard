import * as podmanDesktopApi from '@podman-desktop/api';
import type {
  BoxInfo,
  BoxSummary,
  CreateOptions,
  DoctorReport,
  EgressAllowlist,
  EgressDenied,
  EgressStatus,
  GcPreview,
  SecretIndex,
} from './protocol';

// Thin wrapper around the isopod CLI. The CLI is the single source of truth;
// this module only shells out and parses the --json contract
// (docs/cli-contract.md). No isopod logic is reimplemented here.

const ISOPOD = 'isopod';

async function execJson<T>(args: string[]): Promise<T> {
  const result = await podmanDesktopApi.process.exec(ISOPOD, args);
  try {
    return JSON.parse(result.stdout) as T;
  } catch {
    throw new Error(`isopod ${args.join(' ')}: output is not valid JSON`);
  }
}

export async function listBoxes(): Promise<BoxSummary[]> {
  return execJson<BoxSummary[]>(['list', '--json']);
}

export async function boxInfo(name: string): Promise<BoxInfo> {
  return execJson<BoxInfo>(['info', name, '--json']);
}

// The box's container as Podman Desktop sees it, matched by the io.isopod.box
// label (value = box name). Returns undefined when the box has no live
// container (stopped-and-removed or never created) — the deep-links only exist
// for a container the built-in pages can actually show.
export async function findBoxContainer(
  name: string,
): Promise<{ id: string; engineId: string; } | undefined> {
  const containers = await podmanDesktopApi.containerEngine.listContainers();
  const match = containers.find((c) => c.Labels?.['io.isopod.box'] === name);
  return match ? { id: match.Id, engineId: match.engineId } : undefined;
}

export async function egressStatus(): Promise<EgressStatus> {
  return execJson<EgressStatus>(['egress', 'status', '--json']);
}

export async function egressAllowlist(): Promise<EgressAllowlist> {
  return execJson<EgressAllowlist>(['egress', 'allowlist', '--json']);
}

export async function egressDenied(): Promise<EgressDenied> {
  return execJson<EgressDenied>(['egress', 'denied', '--json']);
}

export async function secrets(): Promise<SecretIndex> {
  return execJson<SecretIndex>(['secret', 'ls', '--json']);
}

export async function doctor(): Promise<DoctorReport> {
  return execJson<DoctorReport>(['doctor', '--json']);
}

// Preview which images `gc` would reclaim — read-only, never removes.
export async function gcPreview(): Promise<GcPreview> {
  return execJson<GcPreview>(['gc', '--json']);
}

// Reclaim unreferenced images non-interactively. Returns the CLI's summary text.
export async function gcRun(): Promise<string> {
  const result = await podmanDesktopApi.process.exec(ISOPOD, ['gc', '--force']);
  return result.stdout.trim();
}

// Assemble the `isopod create` argv from wizard options. Empty/false fields are
// omitted so the CLI applies its own defaults. Exported for unit testing.
export function createArgs(options: CreateOptions): string[] {
  const args = ['create', options.name];
  for (const repo of options.repos) args.push('--repo', repo);
  if (options.color) args.push('--color', options.color);
  if (options.memory) args.push('--memory', options.memory);
  if (options.cpus) args.push('--cpus', options.cpus);
  if (options.engine) args.push('--engine', options.engine);
  if (options.harden) args.push('--harden', options.harden);
  if (options.dev) args.push('--dev');
  if (options.noSudo) args.push('--no-sudo');
  return args;
}

// `isopod create` is fully flag-driven and non-interactive, so process.exec
// (no PTY) can run it directly.
export async function createBox(options: CreateOptions): Promise<void> {
  await podmanDesktopApi.process.exec(ISOPOD, createArgs(options));
}

export async function startBox(name: string): Promise<void> {
  await podmanDesktopApi.process.exec(ISOPOD, ['start', name]);
}

export async function stopBox(name: string): Promise<void> {
  await podmanDesktopApi.process.exec(ISOPOD, ['stop', name]);
}

// Launches the IDE attached to the box. Detached: the IDE outlives us and we
// must not hold its stdio open.
export async function openInIde(name: string): Promise<void> {
  await podmanDesktopApi.process.exec(ISOPOD, ['code', name], { detached: true });
}

export async function egressAllow(domain: string): Promise<void> {
  await podmanDesktopApi.process.exec(ISOPOD, ['egress', 'allow', domain]);
}

export interface LogTailHandle {
  stop: () => void;
}

// Streams `isopod egress log` line-batches to onLines until stop() is called.
// onExit fires when the process ends for any reason (including stop()).
export function tailEgressLog(
  onLines: (lines: string[]) => void,
  onExit: (error?: string) => void,
): LogTailHandle {
  const source = new podmanDesktopApi.CancellationTokenSource();
  const logger: podmanDesktopApi.Logger = {
    log: (...data: unknown[]): void => {
      const lines = data
        .map(String)
        .flatMap((chunk) => chunk.split('\n'))
        .filter((line) => line.length > 0);
      if (lines.length > 0) onLines(lines);
    },
    error: (...data: unknown[]): void => {
      const lines = data.map(String).filter((line) => line.length > 0);
      if (lines.length > 0) onLines(lines);
    },
    warn: (): void => {},
  };
  podmanDesktopApi.process
    .exec(ISOPOD, ['egress', 'log'], { logger, token: source.token })
    .then(() => onExit())
    .catch((err: unknown) => {
      // Cancellation surfaces as a rejected promise; a user-initiated stop is
      // not an error worth showing.
      if (source.token.isCancellationRequested) onExit();
      else onExit(err instanceof Error ? err.message : String(err));
    });
  return {
    stop: (): void => {
      source.cancel();
    },
  };
}

// The container-menu command receives the container the user clicked. Boxes
// are recognized by the io.isopod.box label (value = box name).
export function boxNameFromContainer(container: { Labels?: Record<string, string>; }): string | undefined {
  return container.Labels?.['io.isopod.box'];
}
