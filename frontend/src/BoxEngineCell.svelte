<script lang="ts">
import type { BoxSummary } from '../../src/protocol';

interface Props {
  object: BoxSummary;
}
let { object }: Props = $props();

// A box's engine tells you podman/docker/Apple-container, but not whether it
// runs as a plain shared-kernel container or in its own microVM. isopod reports
// that as `isolation` (from the runtime tier); surface it as a small pill so a
// microVM box is distinguishable from a stock podman container at a glance.
interface Badge {
  label: string;
  title: string;
  accent: boolean;
}

const badge: Badge | null = $derived(pill(object));

function pill(box: BoxSummary): Badge | null {
  const rt = box.runtime && box.runtime !== 'container' ? box.runtime : '';
  switch (box.isolation) {
    case 'microvm':
      return {
        label: 'microVM',
        title: `Runs in its own microVM${rt ? ` (${rt})` : ''} — separate guest kernel`,
        accent: true,
      };
    case 'sandbox':
      return {
        label: 'sandbox',
        title: `Syscall-sandboxed runtime${rt ? ` (${rt})` : ''} — shared kernel`,
        accent: false,
      };
    case 'unknown':
      return rt ? { label: rt, title: `Custom runtime: ${rt}`, accent: false } : null;
    default:
      return null; // 'container' or older CLI without the field: a plain container.
  }
}
</script>

<span class="flex items-center gap-1.5">
  <span>{object.engine}</span>
  {#if badge}
    <span
      class="rounded border px-1.5 py-0.5 text-[11px] leading-none whitespace-nowrap {badge.accent
        ? 'border-[var(--pd-tab-highlight,#a074c4)] text-[var(--pd-tab-highlight,#a074c4)]'
        : 'border-[var(--pd-content-divider,#555)] opacity-80'}"
      title={badge.title}
    >{badge.label}</span>
  {/if}
</span>
