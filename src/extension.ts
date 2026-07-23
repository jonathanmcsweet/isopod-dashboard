import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as podmanDesktopApi from '@podman-desktop/api';
import * as isopod from './isopod-cli';
import type { UiEvent, UiRequest } from './protocol';

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

function stopLogTail(): void {
  logTail?.stop();
  logTail = undefined;
}

async function handleRequest(request: UiRequest): Promise<void> {
  switch (request.kind) {
    case 'refresh':
      await Promise.all([pushBoxes(), pushEgressStatus()]);
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
    case 'startBox':
    case 'stopBox': {
      const action = request.kind === 'startBox' ? isopod.startBox : isopod.stopBox;
      await send({ kind: 'busy', name: request.name, busy: true });
      try {
        await action(request.name);
      } catch (err: unknown) {
        await send({
          kind: 'error',
          message: `${request.kind === 'startBox' ? 'start' : 'stop'} ${request.name} failed: ${err instanceof Error ? err.message : String(err)}`,
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
  const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource}; img-src ${webview.cspSource} data:;">`;
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
    podmanDesktopApi.commands.registerCommand('isopod.openDashboard', () =>
      openDashboard(context.extensionUri.fsPath),
    ),
    podmanDesktopApi.commands.registerCommand(
      'isopod.openInIde',
      async (container: { Labels?: Record<string, string> }) => {
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
