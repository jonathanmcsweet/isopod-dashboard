<script lang="ts">
import { Button, Spinner } from '@podman-desktop/ui-svelte';
import type { DoctorLevel, DoctorReport, GcPreview } from '../../src/protocol';
import { request } from './api';

interface Props {
  report: DoctorReport | null;
  error: string | undefined;
  gc: GcPreview | null;
  gcError: string | undefined;
  loaded: boolean;
}
let { report, error, gc, gcError, loaded }: Props = $props();

// Marker glyph + color per check level, keyed to the --pd status variables.
const levelStyle: Record<string, { mark: string; color: string; }> = {
  ok: { mark: '✓', color: 'var(--pd-status-running, #16a34a)' },
  warn: { mark: '!', color: 'var(--pd-status-degraded, #d97706)' },
  error: { mark: '✕', color: 'var(--pd-status-dead, #dc2626)' },
  na: { mark: '–', color: 'var(--pd-status-stopped, #6b7280)' },
};
function style(level: DoctorLevel) {
  return levelStyle[level] ?? levelStyle.na;
}
</script>

<div class="flex h-full flex-col gap-4">
  <div class="flex items-center gap-4">
    <h2 class="grow text-lg font-semibold">Doctor</h2>
    {#if report}
      <span class="text-sm opacity-70">isopod {report.version}</span>
    {/if}
    <Button type="secondary" on:click={() => request({ kind: 'doctor' })}>Refresh</Button>
  </div>

  {#if error}
    <div class="rounded-md bg-[var(--pd-content-card-bg,#24262e)] p-4 text-sm">
      <p class="text-[color:var(--pd-state-error,#dc2626)]">Couldn't run doctor.</p>
      <p class="mt-1 opacity-70">{error}</p>
    </div>
  {:else if !report}
    {#if loaded}
      <div class="flex items-center gap-2 p-4 text-sm opacity-70">
        <Spinner size="1em" /> Running checks…
      </div>
    {/if}
  {:else}
    <div class="rounded-md bg-[var(--pd-content-card-bg,#24262e)] p-4">
      <h3 class="mb-3 text-sm font-semibold opacity-80">Checks</h3>
      <ul class="flex flex-col gap-2 text-sm">
        {#each report.checks as check (check.id)}
          <li class="flex items-start gap-3">
            <span
              class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style="background-color: {style(check.level).color}"
              title={check.level}
            >{style(check.level).mark}</span>
            <div class="min-w-0">
              <span>{check.label}</span>
              {#if check.hint}
                <span class="opacity-60">— {check.hint}</span>
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  <div class="rounded-md bg-[var(--pd-content-card-bg,#24262e)] p-4">
    <div class="mb-3 flex items-center">
      <h3 class="grow text-sm font-semibold opacity-80">Reclaimable disk</h3>
      {#if gc && gc.images.length > 0}
        <Button type="primary" on:click={() => request({ kind: 'gcRun' })}>
          Collect {gc.images.length} image{gc.images.length === 1 ? '' : 's'}
        </Button>
      {/if}
    </div>
    {#if gcError}
      <p class="text-sm opacity-70">Couldn't read reclaimable images ({gcError}).</p>
    {:else if !gc}
      {#if loaded}<p class="text-sm opacity-50">Checking…</p>{/if}
    {:else if gc.images.length === 0}
      <p class="text-sm opacity-50">No unreferenced isopod images — nothing to reclaim.</p>
    {:else}
      <ul class="flex flex-col gap-0.5 font-mono text-sm">
        {#each gc.images as img (img)}
          <li class="opacity-80">{img}</li>
        {/each}
      </ul>
      <p class="mt-2 text-xs opacity-50">
        Images no existing box references. Collecting runs <code>isopod gc --force</code>.
      </p>
    {/if}
  </div>
</div>
