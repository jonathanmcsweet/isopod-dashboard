<script lang="ts">
// Row actions, styled like Podman Desktop's own list rows: borderless round icon
// buttons in --pd-action-button-* (its ListItemButtonIcon), not bordered text
// buttons. Every icon carries a title/aria-label, which is how the native rows
// label their actions too.
import { Spinner } from '@podman-desktop/ui-svelte';
import type { BoxSummary } from '../../src/protocol';
import { request } from './api';
import { busyBoxes } from './stores.svelte';

interface Props {
  object: BoxSummary;
}
let { object }: Props = $props();

const busy = $derived(busyBoxes.has(object.name));
const running = $derived(object.status === 'running');

const BUTTON = 'inline-flex items-center rounded-full px-2 py-2 text-center cursor-pointer '
  + 'text-[color:var(--pd-action-button-text,#b4b4b4)] '
  + 'hover:bg-[var(--pd-action-button-hover-bg,transparent)] '
  + 'hover:text-[color:var(--pd-action-button-hover-text,#fff)]';
</script>

<div class="flex items-center justify-end">
  {#if busy}
    <span class="px-2 py-2"><Spinner size="1em" /></span>
  {:else}
    {#if running}
      <button
        type="button"
        class={BUTTON}
        title="Open this box in VSCodium"
        aria-label="Open this box in VSCodium"
        onclick={() => request({ kind: 'openInIde', name: object.name })}
      >
        <!-- code brackets: open the workspace in the IDE -->
        <svg
          class="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M8 18l-6-6 6-6M16 6l6 6-6 6" />
        </svg>
      </button>
      <button
        type="button"
        class={BUTTON}
        title="Stop the box"
        aria-label="Stop the box"
        onclick={() => request({ kind: 'stopBox', name: object.name })}
      >
        <!-- filled square: stop, the same mark Podman uses -->
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="5" y="5" width="14" height="14" rx="1" />
        </svg>
      </button>
    {:else}
      <button
        type="button"
        class={BUTTON}
        title="Start the box"
        aria-label="Start the box"
        onclick={() => request({ kind: 'startBox', name: object.name })}
      >
        <!-- filled triangle: start -->
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6 4l14 8-14 8z" />
        </svg>
      </button>
    {/if}
  {/if}
</div>
