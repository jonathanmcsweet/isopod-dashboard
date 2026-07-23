import * as podmanDesktopApi from '@podman-desktop/api';
import type { BoxSummary, EgressStatus } from './protocol';

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

export async function egressStatus(): Promise<EgressStatus> {
  return execJson<EgressStatus>(['egress', 'status', '--json']);
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
