<script lang="ts">
// The Boxes tab body: detail panel, create wizard, or the list. Extracted from
// App.svelte on purpose — the `import BoxDetail` line kept getting dropped when
// App.svelte's import block was resolved during merges (four times), leaving
// <BoxDetail> undefined so clicking a box name rendered nothing. `vite build`
// doesn't error on that (only svelte-check does), so it shipped unnoticed.
// Keeping these imports in a small, single-purpose file that merges rarely touch
// makes that regression far less likely to recur.
import { Button } from '@podman-desktop/ui-svelte';
import type { BoxSummary } from '../../src/protocol';
import BoxDetail from './BoxDetail.svelte';
import BoxList from './BoxList.svelte';
import CreateBox from './CreateBox.svelte';
import { createForm, detail, openCreateForm } from './stores.svelte';

interface Props {
  boxes: BoxSummary[];
  loaded: boolean;
}
let { boxes, loaded }: Props = $props();
</script>

{#if detail.name !== null}
  <BoxDetail name={detail.name} info={detail.info} error={detail.error} />
{:else if createForm.open}
  <CreateBox />
{:else}
  <div class="mb-3 flex justify-end">
    <Button type="primary" on:click={openCreateForm}>+ New box</Button>
  </div>
  <BoxList {boxes} {loaded} />
{/if}
