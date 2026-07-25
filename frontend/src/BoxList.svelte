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
// with ellipsis) — the grid can never grow wider than its container, which is
// what caused the horizontal scroll before. Only Actions keeps a floor so its
// buttons never clip. Combined with `min-w-0` on the flex ancestors in App.svelte
// (the actual overflow culprit), the table now always fits the available width.
const columns = [
  new TableColumn<BoxSummary>('Status', {
    width: '70px',
    renderer: BoxStatusCell,
    comparator: (a, b) => a.status.localeCompare(b.status),
  }),
  new TableColumn<BoxSummary>('Name', {
    width: 'minmax(0,2fr)',
    renderer: BoxNameCell,
    comparator: (a, b) => a.name.localeCompare(b.name),
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
  new TableColumn<BoxSummary>('Engine', {
    width: 'minmax(0,1.5fr)',
    renderer: BoxEngineCell,
    comparator: (a, b) => a.engine.localeCompare(b.engine),
  }),
  new TableColumn<BoxSummary>('Actions', {
    width: 'minmax(8rem,0.9fr)',
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
