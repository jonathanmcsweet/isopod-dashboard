<script lang="ts">
import { Tooltip } from '@podman-desktop/ui-svelte';
import type { BoxSummary } from '../../src/protocol';

interface Props {
  object: BoxSummary;
}
let { object }: Props = $props();

const dotColor = $derived(
  object.status === 'running'
    ? 'var(--pd-status-running, #16a34a)'
    : object.status === 'missing'
    ? 'var(--pd-status-dead, #dc2626)'
    : 'var(--pd-status-stopped, #6b7280)',
);
</script>

<Tooltip tip={object.status}>
  <div class="flex justify-center">
    <span class="inline-block h-3 w-3 rounded-full" style="background-color: {dotColor}"></span>
  </div>
</Tooltip>
