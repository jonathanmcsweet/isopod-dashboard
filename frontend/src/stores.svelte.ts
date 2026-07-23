// Shared reactive state that table cell renderers need: Table cells only
// receive their row object, so cross-cutting state lives here.
import { SvelteSet } from 'svelte/reactivity';
import type { BoxInfo } from '../../src/protocol';

export const busyBoxes = new SvelteSet<string>();

// The box whose detail panel is open. `name` drives visibility (a row-cell sets
// it on click); `info`/`error` are filled when the backend's boxInfo event
// arrives. A const object mutated in place so both the cell and App share it.
export const detail = $state<{
  name: string | null;
  info: BoxInfo | null;
  error: string | undefined;
}>({ name: null, info: null, error: undefined });

export function openDetail(name: string): void {
  detail.name = name;
  detail.info = null;
  detail.error = undefined;
}

export function closeDetail(): void {
  detail.name = null;
  detail.info = null;
  detail.error = undefined;
}

// The create-box wizard's form state. `open` drives visibility; the fields map
// to `isopod create` flags. Shared so App can feed picked folders (from the
// backend dialog) into `repos` while the form component binds the rest.
export interface CreateForm {
  open: boolean;
  name: string;
  repos: string[];
  color: string;
  memory: string;
  cpus: string;
  engine: string;
  harden: string;
  dev: boolean;
  noSudo: boolean;
  submitting: boolean;
}

const emptyCreateForm: CreateForm = {
  open: false,
  name: '',
  repos: [],
  color: '',
  memory: '',
  cpus: '',
  engine: '',
  harden: '',
  dev: false,
  noSudo: false,
  submitting: false,
};

export const createForm = $state<CreateForm>({ ...emptyCreateForm });

export function openCreateForm(): void {
  Object.assign(createForm, emptyCreateForm, { open: true });
}

export function resetCreateForm(): void {
  Object.assign(createForm, emptyCreateForm);
}
