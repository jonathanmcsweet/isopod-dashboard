// Shared reactive state that table cell renderers need: Table cells only
// receive their row object, so cross-cutting state lives here.
import { SvelteSet } from 'svelte/reactivity';

export const busyBoxes = new SvelteSet<string>();
