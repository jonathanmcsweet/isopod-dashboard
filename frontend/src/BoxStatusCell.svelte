<script lang="ts">
import { Tooltip } from '@podman-desktop/ui-svelte';
import type { BoxSummary } from '../../src/protocol';
import { isolationSpec } from './isolation';
import IsolationIcon from './IsolationIcon.svelte';

interface Props {
  object: BoxSummary;
}
let { object }: Props = $props();

// Shape encodes the isolation class (microVM chip / sandbox shield / container
// cube); colour encodes the status. Same glyph the engine column classified,
// now doing double duty as the status indicator.
const statusColor = $derived(
  object.status === 'running'
    ? 'var(--pd-status-running, #16a34a)'
    : object.status === 'missing'
    ? 'var(--pd-status-dead, #dc2626)'
    : 'var(--pd-status-stopped, #6b7280)',
);

const spec = $derived(isolationSpec(object.isolation, object.runtime));
const tip = $derived(spec ? `${object.status} · ${spec.label}` : object.status);
</script>

<Tooltip {tip}>
  <div class="flex justify-center" style="color: {statusColor}">
    <IsolationIcon isolation={object.isolation} class="h-4 w-4" />
  </div>
</Tooltip>
