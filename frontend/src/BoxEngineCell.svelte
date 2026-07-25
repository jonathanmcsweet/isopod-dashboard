<script lang="ts">
import type { BoxSummary } from '../../src/protocol';
import IsolationBadge from './IsolationBadge.svelte';

interface Props {
  object: BoxSummary;
}
let { object }: Props = $props();
</script>

<span class="flex min-w-0 items-center gap-1.5">
  <span class="truncate">{object.engine}</span>
  <IsolationBadge isolation={object.isolation} runtime={object.runtime} />
</span>
