<script lang="ts">
import { Button, ErrorMessage } from '@podman-desktop/ui-svelte';
import { onMount } from 'svelte';
import type {
  BoxSummary,
  DoctorReport,
  EgressAllowlist,
  EgressDenied,
  EgressStatus,
  GcPreview,
  SecretIndex,
} from '../../src/protocol';
import { onEvent, request } from './api';
import BoxesTab from './BoxesTab.svelte';
import DoctorPanel from './DoctorPanel.svelte';
import EgressPanel from './EgressPanel.svelte';
import SecretsPanel from './SecretsPanel.svelte';
import { busyBoxes, createForm, detail, resetCreateForm } from './stores.svelte';

type Tab = 'boxes' | 'egress' | 'secrets' | 'doctor';

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
let doctorReport = $state<DoctorReport | null>(null);
let doctorError = $state<string | undefined>(undefined);
let gc = $state<GcPreview | null>(null);
let gcError = $state<string | undefined>(undefined);
let doctorLoaded = $state(false);
let tab = $state<Tab>('boxes');

// Fetch a tab's data the first time it's opened (each needs a CLI call; no point
// paying for it if the user never looks).
function selectTab(next: Tab): void {
  tab = next;
  if (next === 'secrets' && !secretsLoaded) {
    secretsLoaded = true;
    request({ kind: 'secrets' });
  }
  if (next === 'doctor' && !doctorLoaded) {
    doctorLoaded = true;
    request({ kind: 'doctor' });
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
      case 'boxInfo':
        // Fill the open detail panel. Guard on name so a stale response (the
        // user already opened another box, or closed the panel) is ignored.
        if (detail.name === event.name) {
          detail.info = event.info;
          detail.error = event.error;
        }
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
      case 'doctor':
        doctorReport = event.report;
        doctorError = event.error;
        break;
      case 'gcPreview':
        gc = event.gc;
        gcError = event.error;
        break;
      case 'folderPicked':
        // Append newly picked folders to the create form, de-duplicated.
        createForm.repos = [
          ...createForm.repos,
          ...event.paths.filter(p => !createForm.repos.includes(p)),
        ];
        break;
      case 'createResult':
        if (event.ok) {
          resetCreateForm();
        } else {
          createForm.submitting = false;
          lastError = event.error ?? `create ${event.name} failed`;
        }
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

<div class="flex h-full min-w-0 flex-col p-5">
  <div class="mb-4 flex items-center gap-4">
    <h1 class="grow text-xl font-bold">Isopod boxes</h1>
    <Button type="secondary" on:click={() => request({ kind: 'refresh' })}>Refresh</Button>
  </div>

  <!-- Click-driven tabs (the webview has no router), styled to match Podman's
       own filter tabs: always the accent-purple link color (--pd-link, the same
       token the box-name links use), small and light-weight, with the active tab
       distinguished by a purple underline rather than a colour change. We DON'T
       use --pd-tab-* here: in the dark theme those resolve to grey/white, so the
       tabs read as plain text instead of the purple links Podman shows. -->
  <div class="mb-4 flex gap-1 border-b border-[var(--pd-content-divider,#333)] text-[color:var(--pd-link,#8b5cf6)]">
    {#each [{ id: 'boxes', label: 'Boxes' }, { id: 'egress', label: 'Egress' }, { id: 'secrets', label: 'Secrets' }, {
      id: 'doctor',
      label: 'Doctor',
    }] as tabDef (tabDef.id)}
      <button
        type="button"
        aria-current={tab === tabDef.id ? 'page' : undefined}
        class="
          -mb-px cursor-pointer border-b-2 px-3 py-1.5 text-xs whitespace-nowrap hover:opacity-100 {tab === tabDef.id
          ? 'border-[var(--pd-link,#8b5cf6)] font-medium opacity-100'
          : 'border-transparent font-normal opacity-70'}
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

  <div class="min-h-0 min-w-0 grow overflow-auto">
    {#if tab === 'boxes'}
      <BoxesTab {boxes} {loaded} />
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
    {:else if tab === 'secrets'}
      <SecretsPanel {secrets} error={secretsError} loaded={secretsLoaded} />
    {:else}
      <DoctorPanel
        report={doctorReport}
        error={doctorError}
        {gc}
        {gcError}
        loaded={doctorLoaded}
      />
    {/if}
  </div>
</div>
