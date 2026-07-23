<script lang="ts">
  import { Button, Input } from '@podman-desktop/ui-svelte';
  import type { EgressStatus } from '../../src/protocol';
  import { request } from './api';

  interface Props {
    status: EgressStatus | null;
    error: string | undefined;
    logLines: string[];
    logRunning: boolean;
  }
  let { status, error, logLines, logRunning }: Props = $props();

  let domain = $state('');
  let logView = $state<HTMLElement | undefined>(undefined);

  $effect(() => {
    // Follow the tail as lines arrive.
    void logLines.length;
    if (logView) logView.scrollTop = logView.scrollHeight;
  });

  function allowDomain(): void {
    const trimmed = domain.trim();
    if (!trimmed) return;
    request({ kind: 'egressAllow', domain: trimmed });
    domain = '';
  }

  const firewallColor = $derived(
    status?.firewall === 'active'
      ? 'var(--pd-status-running, #16a34a)'
      : status?.firewall === 'inactive'
        ? 'var(--pd-status-dead, #dc2626)'
        : 'var(--pd-status-stopped, #6b7280)',
  );
</script>

<div class="flex h-full flex-col gap-4">
  <div class="rounded-md bg-[var(--pd-content-card-bg,#24262e)] p-4">
    <h2 class="mb-3 text-lg font-semibold">Egress status</h2>
    {#if status}
      <div class="grid grid-cols-2 gap-x-8 gap-y-1 text-sm md:grid-cols-3">
        <div><span class="opacity-70">Mode:</span> {status.mode}</div>
        <div class="flex items-center gap-2">
          <span class="opacity-70">Firewall:</span>
          <span class="inline-block h-2.5 w-2.5 rounded-full" style="background-color: {firewallColor}"></span>
          {status.firewall}
        </div>
        <div><span class="opacity-70">Network:</span> {status.network}</div>
        <div><span class="opacity-70">Subnet:</span> {status.subnet}</div>
        <div><span class="opacity-70">DNS:</span> {status.dns}</div>
        <div>
          <span class="opacity-70">Proxy:</span>
          {#if status.proxy}
            {status.proxy.running ? `running on :${status.proxy.port}` : 'stopped'}
          {:else}
            not configured
          {/if}
        </div>
      </div>
      {#if status.firewall === 'unknown'}
        <p class="mt-2 text-sm opacity-70">
          Firewall state needs root to read — run <code>sudo isopod egress status</code> in a terminal.
        </p>
      {/if}
    {:else}
      <p class="text-sm opacity-70">
        Egress isolation is not configured{error ? ` (${error})` : ''}. See <code>isopod egress --help</code>.
      </p>
    {/if}
  </div>

  <div class="rounded-md bg-[var(--pd-content-card-bg,#24262e)] p-4">
    <h2 class="mb-3 text-lg font-semibold">Allow a domain</h2>
    <div class="flex items-center gap-2">
      <Input placeholder="example.com" bind:value={domain} />
      <Button type="primary" disabled={!domain.trim()} on:click={allowDomain}>Allow</Button>
    </div>
    <p class="mt-2 text-sm opacity-70">
      Appends to your user allow-list; activating it still requires <code>sudo isopod egress apply</code>.
    </p>
  </div>

  <div class="flex min-h-0 grow flex-col rounded-md bg-[var(--pd-content-card-bg,#24262e)] p-4">
    <div class="mb-3 flex items-center">
      <h2 class="grow text-lg font-semibold">Proxy access log</h2>
      {#if logRunning}
        <Button type="secondary" on:click={() => request({ kind: 'egressLogStop' })}>Stop tail</Button>
      {:else}
        <Button type="secondary" on:click={() => request({ kind: 'egressLogStart' })}>Start tail</Button>
      {/if}
    </div>
    <div
      bind:this={logView}
      class="min-h-32 grow overflow-auto rounded bg-[var(--pd-terminal-background,#12141a)] p-2 font-mono text-xs whitespace-pre-wrap">
      {#if logLines.length === 0}
        <span class="opacity-50">{logRunning ? 'Waiting for egress traffic…' : 'Tail stopped.'}</span>
      {:else}
        {#each logLines as line, i (i)}
          <div>{line}</div>
        {/each}
      {/if}
    </div>
  </div>
</div>
