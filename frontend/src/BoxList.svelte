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
// the other half of the overflow fix: zeroing the Table's own `mx-5`.
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
  <!-- ui-svelte's Table root is `w-full mx-5`: on a 100%-wide box those 20px
       side margins push it 40px past its container — a permanent horizontal
       scroll with the Actions column clipped off the right edge, and a 20px
       indent past the header/tabs. Zero the margin (targeting the Table's own
       role="table" root) so it fills the column exactly and the fr tracks size
       to the real width. -->
  <div class="[&>[role=table]]:mx-0">
    <Table kind="box" data={boxes} {columns} {row} defaultSortColumn="Name" />
  </div>
{/if}
