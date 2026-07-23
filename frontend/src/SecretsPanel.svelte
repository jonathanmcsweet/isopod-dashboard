<script lang="ts">
import { Button, EmptyScreen, Spinner } from '@podman-desktop/ui-svelte';
import type { SecretIndex } from '../../src/protocol';
import { request } from './api';

interface Props {
  secrets: SecretIndex | null;
  error: string | undefined;
  loaded: boolean;
}
let { secrets, error, loaded }: Props = $props();
</script>

<div class="flex h-full flex-col gap-4">
  <div class="flex items-center gap-4">
    <h2 class="grow text-lg font-semibold">Secrets</h2>
    {#if secrets}
      <span class="text-sm opacity-70">backend: {secrets.backend}</span>
    {/if}
    <Button type="secondary" on:click={() => request({ kind: 'secrets' })}>Refresh</Button>
  </div>

  <p class="text-sm opacity-70">
    Names only — values never leave the host store. Attach at create time with
    <code>isopod create &lt;name&gt; --secret NAME</code>.
  </p>

  {#if error}
    <div class="rounded-md bg-[var(--pd-content-card-bg,#24262e)] p-4 text-sm">
      <p class="text-[color:var(--pd-state-error,#dc2626)]">Couldn't load secrets.</p>
      <p class="mt-1 opacity-70">{error}</p>
    </div>
  {:else if !secrets}
    {#if loaded}
      <div class="flex items-center gap-2 p-4 text-sm opacity-70">
        <Spinner size="1em" /> Loading…
      </div>
    {/if}
  {:else if secrets.secrets.length === 0}
    <EmptyScreen
      icon={undefined}
      title="No secrets"
      message="Store one with: isopod secret set <NAME>"
    />
  {:else}
    <div class="flex flex-col gap-2">
      {#each secrets.secrets as entry (entry.name)}
        <div class="flex items-center gap-3 rounded-md bg-[var(--pd-content-card-bg,#24262e)] p-3">
          <span class="font-mono text-sm">{entry.name}</span>
          <div class="flex grow flex-wrap items-center justify-end gap-1.5">
            {#if entry.boxes.length === 0}
              <span class="text-xs opacity-50">unused</span>
            {:else}
              {#each entry.boxes as box (box)}
                <span
                  class="rounded-full bg-[var(--pd-label-bg,#3a3d46)] px-2 py-0.5 text-xs text-[color:var(--pd-label-text,#d4d4d4)]"
                >{box}</span>
              {/each}
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
