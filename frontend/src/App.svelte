<script lang="ts">
import { Button, ErrorMessage } from '@podman-desktop/ui-svelte';
import { onMount } from 'svelte';
import type {
  BoxSummary,
  EgressAllowlist,
  EgressDenied,
  EgressStatus,
  SecretIndex,
} from '../../src/protocol';
import { onEvent, request } from './api';
import BoxList from './BoxList.svelte';
import EgressPanel from './EgressPanel.svelte';
import SecretsPanel from './SecretsPanel.svelte';
import { busyBoxes, detail } from './stores.svelte';

type Tab = 'boxes' | 'egress' | 'secrets';

let boxes = $state<BoxSummary[]>([]);
let loaded = $state(false);
let egress = $state<EgressStatus | null>(null);
let egressError = $state<string | undefined>(undefined);
let allowlist = $state<EgressAllowlist | null>(null);
let denied = $state<EgressDenied | null>(null);
let deniedError = $state<string | undefined>(undefined);
let logLines = $state<string[]>([]);
let logRunning = $state(false);
let lastError = $state<string | undefined>(undefined);
let secrets = $state<SecretIndex | null>(null);
let secretsError = $state<string | undefined>(undefined);
let secretsLoaded = $state(false);
let tab = $state<Tab>('boxes');

// Fetch the secret index the first time the Secrets tab is opened (it needs a
// CLI call; no point paying for it if the user never looks).
function selectTab(next: Tab): void {
  tab = next;
  if (next === 'secrets' && !secretsLoaded) {
    secretsLoaded = true;
    request({ kind: 'secrets' });
  }
}

const MAX_LOG_LINES = 2000;

onMount(() => {
  onEvent(event => {
    switch (event.kind) {
      case 'boxes':
        boxes = event.boxes;
        loaded = true;
        break;
      case 'egressStatus':
        egress = event.status;
        egressError = event.error;
        break;
      case 'egressAllowlist':
        allowlist = event.allowlist;
        break;
      case 'egressDenied':
        denied = event.denied;
        deniedError = event.error;
        break;
      case 'secrets':
        secrets = event.secrets;
        secretsError = event.error;
        break;
      case 'egressLog':
        logLines = [...logLines, ...event.lines].slice(-MAX_LOG_LINES);
        break;
      case 'egressLogState':
        logRunning = event.running;
        break;
      case 'busy':
        if (event.busy) busyBoxes.add(event.name);
        else busyBoxes.delete(event.name);
        break;
      case 'error':
        lastError = event.message;
        break;
    }
  });
  request({ kind: 'refresh' });
});
</script>

<div class="flex h-full flex-col p-5">
  <div class="mb-4 flex items-center gap-4">
    <h1 class="grow text-xl font-bold">Isopod boxes</h1>
    <Button type="secondary" on:click={() => request({ kind: 'refresh' })}>Refresh</Button>
  </div>

  <div class="mb-4 flex gap-1 border-b border-[var(--pd-content-divider,#333)]">
    {#each [{ id: 'boxes', label: 'Boxes' }, { id: 'egress', label: 'Egress' }, { id: 'secrets', label: 'Secrets' }] as tabDef (tabDef.id)}
      <button
        class="
          cursor-pointer border-b-2 px-4 py-2 text-sm {tab === tabDef.id
          ? 'border-[var(--pd-tab-highlight,#a074c4)] font-semibold'
          : 'border-transparent opacity-70 hover:opacity-100'}
        "
        onclick={() => selectTab(tabDef.id as Tab)}
      >
        {tabDef.label}
      </button>
    {/each}
  </div>

  {#if lastError}
    <div class="mb-3">
      <ErrorMessage error={lastError} />
      <Button type="link" on:click={() => (lastError = undefined)}>Dismiss</Button>
    </div>
  {/if}

  <div class="min-h-0 grow overflow-auto">
    {#if tab === 'boxes'}
      {#if detail.name !== null}
        <BoxDetail name={detail.name} info={detail.info} error={detail.error} />
      {:else}
        <BoxList {boxes} {loaded} />
      {/if}
    {:else if tab === 'egress'}
      <EgressPanel
        status={egress}
        error={egressError}
        {allowlist}
        {denied}
        {deniedError}
        {logLines}
        {logRunning}
      />
    {:else}
      <SecretsPanel {secrets} error={secretsError} loaded={secretsLoaded} />
    {/if}
  </div>
</div>
