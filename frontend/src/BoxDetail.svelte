<script lang="ts">
import { Button, Spinner } from '@podman-desktop/ui-svelte';
import type { BoxInfo, ContainerView } from '../../src/protocol';
import { request } from './api';
import { closeDetail } from './stores.svelte';

interface Props {
  name: string;
  info: BoxInfo | null;
  error: string | undefined;
}
let { name, info, error }: Props = $props();

const statusColor = $derived(
  info?.status === 'running'
    ? 'var(--pd-status-running, #16a34a)'
    : info?.status === 'missing'
    ? 'var(--pd-status-dead, #dc2626)'
    : 'var(--pd-status-stopped, #6b7280)',
);

function copy(text: string): void {
  request({ kind: 'copyText', text });
}

function open(view: ContainerView): void {
  request({ kind: 'openContainerView', name, view });
}

const deepLinks: { view: ContainerView; label: string; }[] = [
  { view: 'details', label: 'Container' },
  { view: 'logs', label: 'Logs' },
  { view: 'terminal', label: 'Terminal' },
  { view: 'inspect', label: 'Inspect' },
];
</script>

<div class="flex h-full flex-col gap-4">
  <div class="flex items-center gap-3">
    <Button type="link" title="Back to the box list" on:click={closeDetail}>← Back</Button>
    {#if info}
      <span class="inline-block h-3 w-3 rounded-full" style="background-color: {statusColor}"></span>
    {/if}
    <h2 class="grow truncate text-lg font-semibold">{name}</h2>
    {#if info?.color}
      <span class="flex items-center gap-1.5 text-sm opacity-70">
        <span class="inline-block h-3 w-3 rounded" style="background-color: {info.color}"></span>
        {info.color}
      </span>
    {/if}
  </div>

  {#if error}
    <div class="rounded-md bg-[var(--pd-content-card-bg,#24262e)] p-4 text-sm">
      <p class="text-[color:var(--pd-state-error,#dc2626)]">Couldn't load box detail.</p>
      <p class="mt-1 opacity-70">{error}</p>
    </div>
  {:else if !info}
    <div class="flex items-center gap-2 p-4 text-sm opacity-70">
      <Spinner size="1em" /> Loading…
    </div>
  {:else}
    <div class="rounded-md bg-[var(--pd-content-card-bg,#24262e)] p-4">
      <h3 class="mb-3 text-sm font-semibold opacity-80">Connection</h3>
      <div class="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
        <span class="opacity-70">Status</span>
        <span>{info.status}</span>

        <span class="opacity-70">SSH host</span>
        <span class="flex items-center gap-2">
          <code class="font-mono">{info.ssh_host}</code>
          <Button type="link" title="Copy SSH host" on:click={() => copy(info.ssh_host)}>Copy</Button>
        </span>

        <span class="opacity-70">Port</span>
        <span class="font-mono">{info.port === null ? '?' : info.port}</span>

        <span class="opacity-70">Engine</span>
        <span>{info.engine}</span>

        <span class="opacity-70">Workspace</span>
        <span class="flex items-center gap-2">
          <code class="truncate font-mono">{info.workspace}</code>
          <Button type="link" title="Copy workspace path" on:click={() => copy(info.workspace)}>Copy</Button>
        </span>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="rounded-md bg-[var(--pd-content-card-bg,#24262e)] p-4">
        <h3 class="mb-3 text-sm font-semibold opacity-80">Forwarded ports</h3>
        {#if info.forwards.length === 0}
          <p class="text-sm opacity-50">None</p>
        {:else}
          <ul class="flex flex-col gap-1 font-mono text-sm">
            {#each info.forwards as fwd (fwd)}
              <li>{fwd}</li>
            {/each}
          </ul>
        {/if}
      </div>

      <div class="rounded-md bg-[var(--pd-content-card-bg,#24262e)] p-4">
        <h3 class="mb-3 text-sm font-semibold opacity-80">Secrets</h3>
        {#if info.secrets.length === 0}
          <p class="text-sm opacity-50">None</p>
        {:else}
          <ul class="flex flex-col gap-1 font-mono text-sm">
            {#each info.secrets as secret (secret)}
              <li>{secret}</li>
            {/each}
          </ul>
          <p class="mt-2 text-xs opacity-50">Names only — values never leave the host store.</p>
        {/if}
      </div>
    </div>

    <div class="rounded-md bg-[var(--pd-content-card-bg,#24262e)] p-4">
      <h3 class="mb-3 text-sm font-semibold opacity-80">Open in Podman Desktop</h3>
      <div class="flex flex-wrap gap-2">
        {#each deepLinks as link (link.view)}
          <Button
            type="secondary"
            title="Open the built-in {link.label.toLowerCase()} view for this box's container"
            on:click={() => open(link.view)}
          >{link.label}</Button>
        {/each}
      </div>
      <p class="mt-2 text-xs opacity-50">
        Deep-links to the built-in container pages (needs a live container).
      </p>
    </div>
  {/if}
</div>
