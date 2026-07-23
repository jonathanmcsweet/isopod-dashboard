<script lang="ts">
import { EmptyScreen, Table, TableColumn, TableRow, TableSimpleColumn } from '@podman-desktop/ui-svelte';
import type { BoxSummary } from '../../src/protocol';
import BoxActionsCell from './BoxActionsCell.svelte';
import BoxColorCell from './BoxColorCell.svelte';
import BoxNameCell from './BoxNameCell.svelte';
import BoxStatusCell from './BoxStatusCell.svelte';

interface Props {
  boxes: BoxSummary[];
  loaded: boolean;
}
let { boxes, loaded }: Props = $props();

const columns = [
  new TableColumn<BoxSummary>('Status', {
    width: '70px',
    renderer: BoxStatusCell,
    comparator: (a, b) => a.status.localeCompare(b.status),
  }),
  new TableColumn<BoxSummary>('Name', {
    width: '2fr',
    renderer: BoxNameCell,
    comparator: (a, b) => a.name.localeCompare(b.name),
  }),
  new TableColumn<BoxSummary, string>('SSH host', {
    width: '2fr',
    renderMapping: box => box.ssh_host,
    renderer: TableSimpleColumn,
  }),
  new TableColumn<BoxSummary, string>('Port', {
    width: '80px',
    renderMapping: box => (box.port === null ? '?' : String(box.port)),
    renderer: TableSimpleColumn,
  }),
  new TableColumn<BoxSummary>('Color', {
    width: '110px',
    renderer: BoxColorCell,
  }),
  new TableColumn<BoxSummary, string>('Engine', {
    width: '100px',
    renderMapping: box => box.engine,
    renderer: TableSimpleColumn,
  }),
  new TableColumn<BoxSummary>('Actions', {
    width: '150px',
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
