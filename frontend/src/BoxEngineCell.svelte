<script lang="ts">
import type { BoxSummary } from '../../src/protocol';
import { isolationSpec } from './isolation';

interface Props {
  object: BoxSummary;
}
let { object }: Props = $props();

// The isolation glyph now lives in the status column; here we spell the tier out
// so a microVM (and which runtime backs it) is unmistakable next to the engine.
const spec = $derived(isolationSpec(object.isolation, object.runtime));
</script>

<span class="flex min-w-0 items-center gap-1.5 text-[color:var(--pd-table-body-text)]">
  <span class="truncate">{object.engine}</span>
  {#if spec}
    <span class="opacity-30" aria-hidden="true">·</span>
    <span
      class="truncate {spec.accent ? 'font-medium text-[color:var(--pd-link,#8b5cf6)]' : 'opacity-70'}"
      title={spec.title}
    >
      {spec.label}{spec.runtime ? ` · ${spec.runtime}` : ''}
    </span>
  {/if}
</span>
