<script lang="ts">
// The Boxes tab body: detail panel, create wizard, or the list. Extracted from
// App.svelte on purpose — the `import BoxDetail` line kept getting dropped when
// App.svelte's import block was resolved during merges (four times), leaving
// <BoxDetail> undefined so clicking a box name rendered nothing. `vite build`
// doesn't error on that (only svelte-check does), so it shipped unnoticed.
// Keeping these imports in a small, single-purpose file that merges rarely touch
// makes that regression far less likely to recur.
import type { BoxSummary } from '../../src/protocol';
import BoxDetail from './BoxDetail.svelte';
import BoxList from './BoxList.svelte';
import CreateBox from './CreateBox.svelte';
import { createForm, detail } from './stores.svelte';

interface Props {
  boxes: BoxSummary[];
  loaded: boolean;
}
let { boxes, loaded }: Props = $props();
</script>

<!-- The detail and create views are card layouts, so they take the page gutter
     here; the list is a Table, which brings its own. "New box" lives in the page
     header (App.svelte) like Podman's own create actions. -->
{#if detail.name !== null}
  <div class="flex min-h-0 min-w-0 grow flex-col px-5 pb-5">
    <BoxDetail name={detail.name} info={detail.info} error={detail.error} />
  </div>
{:else if createForm.open}
  <div class="flex min-h-0 min-w-0 grow flex-col px-5 pb-5">
    <CreateBox />
  </div>
{:else}
  <BoxList {boxes} {loaded} />
{/if}
