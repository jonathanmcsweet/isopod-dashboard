import * as podmanDesktopApi from '@podman-desktop/api';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as isopod from './isopod-cli';
import type { ContainerView, UiEvent, UiRequest } from './protocol';

const VIEW_TYPE = 'isopod-dashboard';

let panel: podmanDesktopApi.WebviewPanel | undefined;
let logTail: isopod.LogTailHandle | undefined;

async function send(event: UiEvent): Promise<void> {
  await panel?.webview.postMessage(event);
}

async function pushBoxes(): Promise<void> {
  try {
    const boxes = await isopod.listBoxes();
    await send({ kind: 'boxes', boxes });
  } catch (err: unknown) {
    await send({
      kind: 'error',
      message: `isopod list failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

async function pushBoxInfo(name: string): Promise<void> {
  try {
    const info = await isopod.boxInfo(name);
    await send({ kind: 'boxInfo', name, info });
  } catch (err: unknown) {
    await send({
      kind: 'boxInfo',
      name,
      info: null,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// Deep-link into a built-in container page (logs/terminal/inspect/details).
// The dashboard doesn't reimplement these — it navigates to Podman Desktop's.
async function openContainerView(name: string, view: ContainerView): Promise<void> {
  const container = await isopod.findBoxContainer(name);
  if (!container) {
    await send({
      kind: 'error',
      message: `No live container for box '${name}' — start it first to view ${view}.`,
    });
    return;
  }
  const nav = podmanDesktopApi.navigation;
  switch (view) {
    case 'details':
      await nav.navigateToContainer(container.id);
      break;
    case 'logs':
      await nav.navigateToContainerLogs(container.id);
      break;
    case 'terminal':
      await nav.navigateToContainerTerminal(container.id);
      break;
    case 'inspect':
      await nav.navigateToContainerInspect(container.id);
      break;
  }
}

async function pushSecrets(): Promise<void> {
  try {
    const secrets = await isopod.secrets();
    await send({ kind: 'secrets', secrets });
  } catch (err: unknown) {
    await send({
      kind: 'secrets',
      secrets: null,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

async function pushDoctor(): Promise<void> {
  try {
    const report = await isopod.doctor();
    await send({ kind: 'doctor', report });
  } catch (err: unknown) {
    await send({
      kind: 'doctor',
      report: null,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

async function pushGcPreview(): Promise<void> {
  try {
    const gc = await isopod.gcPreview();
    await send({ kind: 'gcPreview', gc });
  } catch (err: unknown) {
    await send({
      kind: 'gcPreview',
      gc: null,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

async function pushEgressStatus(): Promise<void> {
  try {
    const status = await isopod.egressStatus();
    await send({ kind: 'egressStatus', status });
  } catch (err: unknown) {
    // Egress not configured is a normal state, not a crash: show it as absent.
    await send({
      kind: 'egressStatus',
      status: null,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

async function pushEgressAllowlist(): Promise<void> {
  try {
    const allowlist = await isopod.egressAllowlist();
    await send({ kind: 'egressAllowlist', allowlist });
  } catch (err: unknown) {
    await send({
      kind: 'egressAllowlist',
      allowlist: null,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

async function pushEgressDenied(): Promise<void> {
  try {
    const denied = await isopod.egressDenied();
    await send({ kind: 'egressDenied', denied });
  } catch (err: unknown) {
    // Reading the proxy log needs root; surface the reason rather than failing.
    await send({
      kind: 'egressDenied',
      denied: null,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

function stopLogTail(): void {
  logTail?.stop();
  logTail = undefined;
}

async function handleRequest(request: UiRequest): Promise<void> {
  switch (request.kind) {
    case 'refresh':
      await Promise.all([pushBoxes(), pushEgressStatus(), pushEgressAllowlist()]);
      break;
    case 'egressAllowlist':
      await pushEgressAllowlist();
      break;
    case 'egressDenied':
      await pushEgressDenied();
      break;
    case 'secrets':
      await pushSecrets();
      break;
    case 'doctor':
      await Promise.all([pushDoctor(), pushGcPreview()]);
      break;
    case 'gcRun':
      try {
        const summary = await isopod.gcRun();
        await podmanDesktopApi.window.showInformationMessage(
          summary || 'Garbage collection complete.',
        );
      } catch (err: unknown) {
        await send({
          kind: 'error',
          message: `gc failed: ${err instanceof Error ? err.message : String(err)}`,
        });
      } finally {
        await pushGcPreview();
      }
      break;
    case 'openInIde':
      try {
        await isopod.openInIde(request.name);
      } catch (err: unknown) {
        await send({
          kind: 'error',
          message: `open failed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
      break;
    case 'boxInfo':
      await pushBoxInfo(request.name);
      break;
    case 'openContainerView':
      try {
        await openContainerView(request.name, request.view);
      } catch (err: unknown) {
        await send({
          kind: 'error',
          message: `open ${request.view} failed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
      break;
    case 'copyText':
      await podmanDesktopApi.env.clipboard.writeText(request.text);
      break;
    case 'pickFolder': {
      const uris = await podmanDesktopApi.window.showOpenDialog({
        selectors: ['openDirectory', 'multiSelections'],
        openLabel: 'Add repo folder',
        title: 'Select repository folder(s) for the box',
      });
      await send({ kind: 'folderPicked', paths: (uris ?? []).map((uri) => uri.fsPath) });
      break;
    }
    case 'createBox': {
      const { options } = request;
      await podmanDesktopApi.window.withProgress(
        {
          location: podmanDesktopApi.ProgressLocation.TASK_WIDGET,
          title: `Creating box '${options.name}'`,
        },
        async () => {
          try {
            await isopod.createBox(options);
            await send({ kind: 'createResult', name: options.name, ok: true });
            await pushBoxes();
          } catch (err: unknown) {
            await send({
              kind: 'createResult',
              name: options.name,
              ok: false,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        },
      );
      break;
    }
    case 'startBox':
    case 'stopBox': {
      const action = request.kind === 'startBox' ? isopod.startBox : isopod.stopBox;
      await send({ kind: 'busy', name: request.name, busy: true });
      try {
        await action(request.name);
      } catch (err: unknown) {
        await send({
          kind: 'error',
          message: `${request.kind === 'startBox' ? 'start' : 'stop'} ${request.name} failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        });
      } finally {
        await send({ kind: 'busy', name: request.name, busy: false });
        await pushBoxes();
      }
      break;
    }
    case 'egressLogStart':
      if (logTail) break;
      logTail = isopod.tailEgressLog(
        (lines) => void send({ kind: 'egressLog', lines }),
        (error) => {
          logTail = undefined;
          void send({ kind: 'egressLogState', running: false });
          if (error) void send({ kind: 'error', message: `egress log: ${error}` });
        },
      );
      await send({ kind: 'egressLogState', running: true });
      break;
    case 'egressLogStop':
      stopLogTail();
      await send({ kind: 'egressLogState', running: false });
      break;
    case 'egressAllow':
      try {
        await isopod.egressAllow(request.domain);
        await podmanDesktopApi.window.showInformationMessage(
          `Added ${request.domain} to the egress allow-list. Run 'sudo isopod egress apply' to activate it.`,
        );
        await pushEgressAllowlist();
      } catch (err: unknown) {
        await send({
          kind: 'error',
          message: `egress allow failed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
      break;
  }
}

// The built webview references its assets with relative paths; rewrite them to
// webview URIs and pin a CSP to the webview origin.
async function webviewHtml(extensionPath: string, webview: podmanDesktopApi.Webview): Promise<string> {
  const webviewDir = join(extensionPath, 'dist', 'webview');
  const raw = await readFile(join(webviewDir, 'index.html'), 'utf-8');
  const rewritten = raw.replace(/(src|href)="\.\/([^"]+)"/g, (_match, attr: string, path: string) => {
    const uri = webview.asWebviewUri(podmanDesktopApi.Uri.file(join(webviewDir, path)));
    return `${attr}="${uri.toString()}"`;
  });
  const csp =
    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource}; img-src ${webview.cspSource} data:;">`;
  return rewritten.replace('<head>', `<head>\n    ${csp}`);
}

async function openDashboard(extensionPath: string): Promise<void> {
  if (panel) {
    const views = await podmanDesktopApi.window.listWebviews();
    const mine = views.find((view) => view.viewType === VIEW_TYPE);
    if (mine) {
      await podmanDesktopApi.navigation.navigateToWebview(mine.id);
      return;
    }
  }
  panel = podmanDesktopApi.window.createWebviewPanel(VIEW_TYPE, 'Isopod');
  panel.onDidDispose(() => {
    stopLogTail();
    panel = undefined;
  });
  panel.webview.onDidReceiveMessage((message: unknown) => {
    void handleRequest(message as UiRequest);
  });
  panel.webview.html = await webviewHtml(extensionPath, panel.webview);
}

export async function activate(context: podmanDesktopApi.ExtensionContext): Promise<void> {
  context.subscriptions.push(
    podmanDesktopApi.commands.registerCommand(
      'isopod.openDashboard',
      () => openDashboard(context.extensionUri.fsPath),
    ),
    podmanDesktopApi.commands.registerCommand(
      'isopod.openInIde',
      async (container: { Labels?: Record<string, string>; }) => {
        const name = container ? isopod.boxNameFromContainer(container) : undefined;
        if (!name) {
          await podmanDesktopApi.window.showErrorMessage('Not an isopod box (no io.isopod.box label).');
          return;
        }
        await isopod.openInIde(name);
      },
    ),
  );

  // Any container state change may affect a box; refresh the open dashboard.
  // Debounced: engine events arrive in bursts (create + start + health checks).
  let refreshTimer: ReturnType<typeof setTimeout> | undefined;
  context.subscriptions.push(
    podmanDesktopApi.containerEngine.onEvent(() => {
      if (!panel) return;
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => void pushBoxes(), 500);
    }),
  );

  // Open the dashboard from the left navigation, not only the command palette.
  context.subscriptions.push(
    podmanDesktopApi.navigation.register('isopod-dashboard', 'isopod.openDashboard'),
  );
}

export function deactivate(): void {
  stopLogTail();
  panel?.dispose();
  panel = undefined;
}
