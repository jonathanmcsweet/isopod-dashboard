<script lang="ts">
// The box's status mark, built like Podman Desktop's own StatusIcon: a rounded
// square filled with the status colour and a contrast-coloured glyph inside
// (running), or an outlined square in the muted "not running" colour otherwise —
// the same shape the Containers, Pods and Images lists show.
//
// We can't use ui-svelte's StatusIcon directly: it renders its `icon` prop with
// no props of its own, and our glyph needs to know the box's isolation tier. So
// the container is a faithful copy of StatusIcon's markup and tokens, with
// IsolationIcon inside — shape still tells you the isolation class (microVM chip
// / sandbox shield / container cube), the square tells you the status.
import IsolationIcon from './IsolationIcon.svelte';

interface Props {
  status: string;
  isolation?: string;
  title?: string;
}
let { status, isolation, title }: Props = $props();

// running is the only solid-green state isopod reports; `missing` (the box is
// configured but its container is gone) is the one hard-error state, so it takes
// the dead/red fill. Everything else — exited, created, anything a newer CLI
// grows — falls back to Podman's outlined "not running" square.
const fill = $derived(
  status === 'running'
    ? 'var(--pd-status-running)'
    : status === 'missing'
    ? 'var(--pd-status-dead)'
    : undefined,
);
</script>

<div class="grid place-content-center">
  <div
    class="
      grid aspect-square place-content-center rounded-sm {fill
      ? 'p-1 text-[var(--pd-status-contrast)]'
      : 'border-2 border-[var(--pd-status-not-running)] p-0.5 text-[var(--pd-status-not-running)]'}
    "
    style={fill ? `background-color: ${fill}` : undefined}
    role="status"
    title={title ?? status}
  >
    <IsolationIcon {isolation} class="h-5 w-5" />
  </div>
</div>
