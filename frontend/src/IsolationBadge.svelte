<script lang="ts">
// Isolation indicator for the box detail view: the shared glyph plus, when
// showLabel is set, the tier word and runtime. Classification/wording lives in
// isolation.ts so this stays in sync with the status and engine cells.
import { isolationSpec } from './isolation';
import IsolationIcon from './IsolationIcon.svelte';

interface Props {
  isolation?: string;
  runtime?: string;
  showLabel?: boolean;
}
let { isolation, runtime, showLabel = false }: Props = $props();

const spec = $derived(isolationSpec(isolation, runtime));
</script>

{#if spec}
  <span
    class="inline-flex items-center gap-1 {spec.accent ? 'text-[color:var(--pd-link,#8b5cf6)]' : 'opacity-70'}"
    title={spec.title}
    aria-label={spec.title}
  >
    <IsolationIcon {isolation} />
    {#if showLabel}
      <span class="text-xs leading-none">
        {spec.label}{spec.runtime ? ` · ${spec.runtime}` : ''}
      </span>
    {/if}
  </span>
{/if}
