<script lang="ts">
import { EmptyScreen, Table, TableColumn, TableRow, TableSimpleColumn } from '@podman-desktop/ui-svelte';
import type { BoxSummary } from '../../src/protocol';
import BoxActionsCell from './BoxActionsCell.svelte';
import BoxColorCell from './BoxColorCell.svelte';
import BoxEngineCell from './BoxEngineCell.svelte';
import BoxNameCell from './BoxNameCell.svelte';
import BoxStatusCell from './BoxStatusCell.svelte';

interface Props {
  boxes: BoxSummary[];
  loaded: boolean;
}
let { boxes, loaded }: Props = $props();

// Text columns use `minmax(0, fr)` so they SHRINK below their content (cells clip
// with ellipsis) — the grid can never grow wider than its container. Only Actions
// keeps a floor so its buttons never clip. The fr tracks then distribute the full
// container width across the columns (no dead space). See the wrapper below for
// the other half of the overflow fix: the flex row the Table sits in.
const columns = [
  new TableColumn<BoxSummary>('Status', {
    width: '70px',
    align: 'center',
    renderer: BoxStatusCell,
    comparator: (a, b) => a.status.localeCompare(b.status),
  }),
  new TableColumn<BoxSummary>('Name', {
    width: 'minmax(0,2fr)',
    renderer: BoxNameCell,
    comparator: (a, b) => a.name.localeCompare(b.name),
  }),
  // Engine sits right after Name: the engine + isolation tier is a primary fact
  // about a box, so it reads before the connection detail. Wider than the raw
  // engine name to fit the spelled-out tier + runtime (e.g. "podman · microVM · krun").
  new TableColumn<BoxSummary>('Engine', {
    width: 'minmax(0,1.8fr)',
    renderer: BoxEngineCell,
    comparator: (a, b) => a.engine.localeCompare(b.engine),
  }),
  new TableColumn<BoxSummary, string>('SSH host', {
    width: 'minmax(0,2fr)',
    renderMapping: box => box.ssh_host,
    renderer: TableSimpleColumn,
  }),
  new TableColumn<BoxSummary, string>('Port', {
    width: 'minmax(0,0.6fr)',
    renderMapping: box => (box.port === null ? '?' : String(box.port)),
    renderer: TableSimpleColumn,
  }),
  new TableColumn<BoxSummary>('Color', {
    width: 'minmax(0,1fr)',
    renderer: BoxColorCell,
  }),
  // Fixed and right-aligned, like Podman's own Actions column — the icon buttons
  // have a known width, so the text columns get the rest.
  new TableColumn<BoxSummary>('Actions', {
    width: '100px',
    align: 'right',
    renderer: BoxActionsCell,
  }),
];

const row = new TableRow<BoxSummary>({});
</script>

{#if loaded && boxes.length === 0}
  <EmptyScreen
    icon={undefined}
    title="No boxes"
    message="Create one with: isopod create <name> --repo <path>"
  />
{:else}
  <!-- ui-svelte's Table root is `w-full mx-5`, which overflows a block parent by
       those 40px of margin (horizontal scroll, Actions clipped off the right).
       Podman's own lists avoid that by making the parent a flex row: as a flex
       item the Table shrinks to fit its margins instead of forcing them out. Same
       wrapper as ContainerList — the gutters then match the header and tabs. -->
  <div class="flex min-w-full grow">
    <Table kind="box" data={boxes} {columns} {row} defaultSortColumn="Name" />
  </div>
{/if}
