<script lang="ts">
// Visual indicator for a box's isolation class (from isopod's `isolation` field).
// A microVM has its own guest kernel — materially stronger isolation than a plain
// shared-kernel container — so it gets a distinct, accented chip icon. Renders an
// icon always (with a tooltip); pass showLabel to also spell it out (detail view).
interface Props {
  isolation?: string;
  runtime?: string;
  showLabel?: boolean;
}
let { isolation, runtime, showLabel = false }: Props = $props();

type Kind = 'microvm' | 'sandbox' | 'container' | 'unknown';

interface Spec {
  label: string;
  title: string;
  accent: boolean;
}

const rt = $derived(runtime && runtime !== 'container' ? runtime : '');

const spec: Spec | null = $derived(build());

function build(): Spec | null {
  switch (isolation as Kind) {
    case 'microvm':
      return {
        label: 'microVM',
        title: `microVM — its own guest kernel${rt ? ` (${rt} runtime)` : ''}. Stronger isolation than a standard container.`,
        accent: true,
      };
    case 'sandbox':
      return {
        label: 'sandbox',
        title: `Syscall-sandboxed runtime${rt ? ` (${rt})` : ''} — shared host kernel.`,
        accent: false,
      };
    case 'container':
      return {
        label: 'container',
        title: 'Standard container — shares the host kernel.',
        accent: false,
      };
    case 'unknown':
      return {
        label: rt || 'custom',
        title: `Custom runtime${rt ? `: ${rt}` : ''} — isolation tier unknown.`,
        accent: false,
      };
    default:
      return null; // field absent (older isopod): show nothing.
  }
}
</script>

{#if spec}
  <span
    class="inline-flex items-center gap-1 {spec.accent
      ? 'text-[var(--pd-tab-highlight,#a074c4)]'
      : 'opacity-70'}"
    title={spec.title}
    aria-label={spec.title}
  >
    {#if isolation === 'microvm'}
      <!-- chip / CPU: a machine with its own compute (own kernel) -->
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <rect x="6" y="6" width="12" height="12" rx="1" />
        <path
          d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"
          stroke-linecap="round"
        />
      </svg>
    {:else if isolation === 'sandbox'}
      <!-- shield: a syscall sandbox -->
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M12 3l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V6l7-3z" stroke-linejoin="round" />
      </svg>
    {:else}
      <!-- cube: a plain container / unknown runtime -->
      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" stroke-linejoin="round" />
        <path d="M12 12l9-5M12 12v10M12 12L3 7" stroke-linejoin="round" />
      </svg>
    {/if}
    {#if showLabel}
      <span class="text-xs leading-none">{spec.label}</span>
    {/if}
  </span>
{/if}
