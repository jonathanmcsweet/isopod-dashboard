<script lang="ts">
  import type { BoxSummary } from '../../src/protocol';

  interface Props {
    object: BoxSummary;
  }
  let { object }: Props = $props();
</script>

{#if object.color}
  <div class="flex items-center gap-2">
    <!-- isopod preset color names are valid CSS color keywords (teal, …);
         unknown names simply render no dot -->
    <span class="inline-block h-3 w-3 rounded" style="background-color: {object.color}"></span>
    <span class="text-sm">{object.color}</span>
  </div>
{:else}
  <span class="text-sm opacity-50">—</span>
{/if}
