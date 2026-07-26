<script lang="ts">
// The glyph for a box's isolation class, shared by the status cell (tinted with
// the box's status colour) and the isolation badge. Stroke is currentColor, so
// the caller sets the colour. Defaults to the cube (plain container / unknown /
// field absent) so it always renders something — the status cell relies on that.
interface Props {
  isolation?: string;
  class?: string;
}
let { isolation, class: klass = 'h-3.5 w-3.5' }: Props = $props();
</script>

{#if isolation === 'microvm'}
  <!-- chip / CPU: a machine with its own compute (own kernel) -->
  <svg
    class={klass}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    aria-hidden="true"
  >
    <rect x="6" y="6" width="12" height="12" rx="1" />
    <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" stroke-linecap="round" />
  </svg>
{:else if isolation === 'sandbox'}
  <!-- shield: a syscall sandbox -->
  <svg
    class={klass}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    aria-hidden="true"
  >
    <path d="M12 3l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V6l7-3z" stroke-linejoin="round" />
  </svg>
{:else}
  <!-- cube: a plain container / unknown runtime / older CLI -->
  <svg
    class={klass}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    aria-hidden="true"
  >
    <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" stroke-linejoin="round" />
    <path d="M12 12l9-5M12 12v10M12 12L3 7" stroke-linejoin="round" />
  </svg>
{/if}
