<script lang="ts">
  import { Button, Spinner } from '@podman-desktop/ui-svelte';
  import type { BoxSummary } from '../../src/protocol';
  import { request } from './api';
  import { busyBoxes } from './stores.svelte';

  interface Props {
    object: BoxSummary;
  }
  let { object }: Props = $props();

  const busy = $derived(busyBoxes.has(object.name));
  const running = $derived(object.status === 'running');
</script>

<div class="flex items-center justify-end gap-1">
  {#if busy}
    <Spinner size="1em" />
  {:else}
    {#if running}
      <Button
        type="secondary"
        title="Open this box in VSCodium"
        on:click={() => request({ kind: 'openInIde', name: object.name })}>Open</Button>
      <Button
        type="link"
        title="Stop the box"
        on:click={() => request({ kind: 'stopBox', name: object.name })}>Stop</Button>
    {:else}
      <Button
        type="secondary"
        title="Start the box"
        on:click={() => request({ kind: 'startBox', name: object.name })}>Start</Button>
    {/if}
  {/if}
</div>
