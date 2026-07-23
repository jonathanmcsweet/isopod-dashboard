<script lang="ts">
import type { BoxSummary } from '../../src/protocol';
import { request } from './api';
import { openDetail } from './stores.svelte';

interface Props {
  object: BoxSummary;
}
let { object }: Props = $props();

function open(): void {
  openDetail(object.name);
  request({ kind: 'boxInfo', name: object.name });
}
</script>

<button
  type="button"
  class="cursor-pointer truncate text-left text-[color:var(--pd-link,#8ab4f8)] hover:underline"
  title="View box detail"
  onclick={open}
>
  {object.name}
</button>
