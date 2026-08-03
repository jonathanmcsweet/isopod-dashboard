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

<!-- Podman's own name cells (ContainerColumnName) are NOT link-coloured: the name
     sits in --pd-table-body-text-highlight and only turns --pd-link on hover.
     Colouring it purple at rest is what made this column read differently from
     every other list in the app. -->
<button
  type="button"
  class="
    group max-w-full cursor-pointer truncate text-left text-[color:var(--pd-table-body-text-highlight,var(--pd-content-text,#f2f2f2))]
    hover:text-[color:var(--pd-link,#8b5cf6)]
  "
  title="View box detail"
  onclick={open}
>
  {object.name}
</button>
