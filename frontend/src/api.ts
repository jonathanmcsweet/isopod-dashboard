import type { UiRequest, UiEvent } from '../../src/protocol';

// Bridge to the extension backend. Podman Desktop injects
// acquirePodmanDesktopApi() into webview pages (same contract as VS Code's
// acquireVsCodeApi).
interface PodmanDesktopApi {
  postMessage(msg: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare global {
  function acquirePodmanDesktopApi(): PodmanDesktopApi;
}

const api = acquirePodmanDesktopApi();

export function request(message: UiRequest): void {
  api.postMessage(message);
}

export function onEvent(handler: (event: UiEvent) => void): void {
  window.addEventListener('message', messageEvent => {
    const data: unknown = messageEvent.data;
    if (data && typeof data === 'object' && 'kind' in data) {
      handler(data as UiEvent);
    }
  });
}
