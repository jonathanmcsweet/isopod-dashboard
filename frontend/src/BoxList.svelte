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

// Widths are `minmax(floor, fr)` so the table fills the available width and the
// columns share it proportionally instead of being pinned to fixed pixels (which
// left dead space on wide windows and clipped the Actions column). The floors
// keep each column readable; only a very narrow window scrolls horizontally.
const columns = [
  new TableColumn<BoxSummary>('Status', {
    width: '70px',
    renderer: BoxStatusCell,
    comparator: (a, b) => a.status.localeCompare(b.status),
  }),
  new TableColumn<BoxSummary>('Name', {
    width: 'minmax(8rem,2fr)',
    renderer: BoxNameCell,
    comparator: (a, b) => a.name.localeCompare(b.name),
  }),
  new TableColumn<BoxSummary, string>('SSH host', {
    width: 'minmax(8rem,2fr)',
    renderMapping: box => box.ssh_host,
    renderer: TableSimpleColumn,
  }),
  new TableColumn<BoxSummary, string>('Port', {
    width: 'minmax(4rem,0.6fr)',
    renderMapping: box => (box.port === null ? '?' : String(box.port)),
    renderer: TableSimpleColumn,
  }),
  new TableColumn<BoxSummary>('Color', {
    width: 'minmax(6rem,1fr)',
    renderer: BoxColorCell,
  }),
  new TableColumn<BoxSummary>('Engine', {
    width: 'minmax(9rem,1.4fr)',
    renderer: BoxEngineCell,
    comparator: (a, b) => a.engine.localeCompare(b.engine),
  }),
  new TableColumn<BoxSummary>('Actions', {
    width: 'minmax(9rem,0.8fr)',
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
  <Table kind="box" data={boxes} {columns} {row} defaultSortColumn="Name" />
{/if}
