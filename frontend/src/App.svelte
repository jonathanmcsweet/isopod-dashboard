<script lang="ts">
import { Button, ErrorMessage, NavPage } from '@podman-desktop/ui-svelte';
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
import { busyBoxes, createForm, detail, openCreateForm, resetCreateForm } from './stores.svelte';

type Tab = 'boxes' | 'egress' | 'secrets' | 'doctor';

const TABS: { id: Tab; label: string; }[] = [
  { id: 'boxes', label: 'Boxes' },
  { id: 'egress', label: 'Egress' },
  { id: 'secrets', label: 'Secrets' },
  { id: 'doctor', label: 'Doctor' },
];

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

<!-- NavPage is the shell every native list page uses (Containers, Images, Pods…):
     it owns the header, the action slot, the tab strip and the content region,
     with Podman's own paddings and colour tokens. Search is off for now -->
<NavPage title="Isopod boxes" searchEnabled={false}>
  {#snippet additionalActions()}
    <Button
      type="secondary"
      title="Re-read boxes from the isopod CLI"
      on:click={() => request({ kind: 'refresh' })}
    >
      Refresh
    </Button>
    {#if tab === 'boxes' && detail.name === null && !createForm.open}
      <!-- Podman puts a list's create action in the page header (Containers →
           "Create"), not above the table. -->
      <Button title="Create a new box" on:click={openCreateForm}>New box</Button>
    {/if}
  {/snippet}

  {#snippet tabs()}
    <!-- Click-driven (the webview has no router), but rendered with ui-svelte's
         own `type="tab"` Button, so the underline, weight and --pd-button-tab-*
         colours are literally the ones Podman's own filter tabs use. -->
    {#each TABS as tabDef (tabDef.id)}
      <Button type="tab" selected={tab === tabDef.id} on:click={() => selectTab(tabDef.id)}>
        {tabDef.label}
      </Button>
    {/each}
  {/snippet}

  {#snippet content()}
    <!-- min-h-0 + grow all the way down so the panels that fill their height (the
         egress log tails inside its own scroller) still get a definite height
         from NavPage's content region. -->
    <div class="flex min-h-0 w-full min-w-0 grow flex-col">
      {#if lastError}
        <div class="mb-3 px-5">
          <ErrorMessage error={lastError} />
          <Button type="link" on:click={() => (lastError = undefined)}>Dismiss</Button>
        </div>
      {/if}

      {#if tab === 'boxes'}
        <BoxesTab {boxes} {loaded} />
      {:else if tab === 'egress'}
        <!-- The Table brings its own gutters; the card-based panels don't, so
             they get NavPage's px-5 here. -->
        <div class="flex min-h-0 min-w-0 grow flex-col px-5 pb-5">
          <EgressPanel
            status={egress}
            error={egressError}
            {allowlist}
            {denied}
            {deniedError}
            {logLines}
            {logRunning}
          />
        </div>
      {:else if tab === 'secrets'}
        <div class="flex min-h-0 min-w-0 grow flex-col px-5 pb-5">
          <SecretsPanel {secrets} error={secretsError} loaded={secretsLoaded} />
        </div>
      {:else}
        <div class="flex min-h-0 min-w-0 grow flex-col px-5 pb-5">
          <DoctorPanel
            report={doctorReport}
            error={doctorError}
            {gc}
            {gcError}
            loaded={doctorLoaded}
          />
        </div>
      {/if}
    </div>
  {/snippet}
</NavPage>
