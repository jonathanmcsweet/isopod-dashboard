// Runtime stub for @podman-desktop/api in unit tests. The real package is
// types-only (the implementation is injected by Podman Desktop at load time),
// so the test config aliases the module here. Tests replace `process.exec`
// with their own mock; keep this file free of vitest imports.

export const process: { exec: (...args: unknown[]) => unknown; } = {
  exec: () => {
    throw new Error('process.exec not stubbed — assign a mock in the test');
  },
};

export class CancellationTokenSource {
  token = { isCancellationRequested: false };
  cancel(): void {
    this.token.isCancellationRequested = true;
  }
}
