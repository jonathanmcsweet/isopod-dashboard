<script lang="ts">
import type { BoxSummary } from '../../src/protocol';
import BoxStatusIcon from './BoxStatusIcon.svelte';
import { isolationSpec } from './isolation';

interface Props {
  object: BoxSummary;
}
let { object }: Props = $props();

// Color/fill encodes the status, the glyph inside encodes the isolation class —
// see BoxStatusIcon.
const spec = $derived(isolationSpec(object.isolation, object.runtime));
const title = $derived(spec ? `${object.status} · ${spec.label}` : object.status);
</script>

<BoxStatusIcon status={object.status} isolation={object.isolation} {title} />
