<script lang="ts">
import { Button, Checkbox, Dropdown, Input, Spinner } from '@podman-desktop/ui-svelte';
import type { CreateOptions } from '../../src/protocol';
import { request } from './api';
import { createForm, resetCreateForm } from './stores.svelte';

// isopod's preset palette (share/colors); '' = auto-rotate.
const colorOptions = [
  { value: '', label: 'auto (rotate)' },
  ...['red', 'orange', 'amber', 'green', 'teal', 'blue', 'purple', 'magenta', 'gray'].map((c) => ({
    value: c,
    label: c,
  })),
];
const engineOptions = [
  { value: '', label: 'auto-detect' },
  { value: 'podman', label: 'podman' },
  { value: 'docker', label: 'docker' },
  { value: 'container', label: 'container (Apple, experimental)' },
];
const hardenOptions = [
  { value: '', label: 'default' },
  { value: 'off', label: 'off' },
];

// A valid isopod box name: letters, digits, . _ - (mirrors valid_name).
const nameValid = $derived(/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(createForm.name.trim()));
const canSubmit = $derived(nameValid && !createForm.submitting);

function removeRepo(path: string): void {
  createForm.repos = createForm.repos.filter((r) => r !== path);
}

function submit(): void {
  if (!canSubmit) return;
  createForm.submitting = true;
  const options: CreateOptions = {
    name: createForm.name.trim(),
    repos: createForm.repos,
    color: createForm.color || undefined,
    memory: createForm.memory.trim() || undefined,
    cpus: createForm.cpus.trim() || undefined,
    engine: createForm.engine || undefined,
    harden: createForm.harden || undefined,
    dev: createForm.dev || undefined,
    noSudo: createForm.noSudo || undefined,
  };
  request({ kind: 'createBox', options });
}
</script>

<div class="flex h-full flex-col gap-4">
  <div class="flex items-center gap-3">
    <Button type="link" title="Back to the box list" on:click={resetCreateForm}>← Back</Button>
    <h2 class="grow text-lg font-semibold">New box</h2>
  </div>

  <div class="flex flex-col gap-4 rounded-md bg-[var(--pd-content-card-bg,#24262e)] p-4">
    <label class="flex flex-col gap-1 text-sm">
      <span class="opacity-70">Name <span class="opacity-50">(required)</span></span>
      <Input
        placeholder="my-box"
        bind:value={createForm.name}
        aria-invalid={!nameValid && createForm.name.length > 0}
      />
      {#if createForm.name.length > 0 && !nameValid}
        <span class="text-xs text-[color:var(--pd-state-error,#dc2626)]">
          Letters, digits, and . _ - only; must not start with . _ -.
        </span>
      {/if}
    </label>

    <div class="flex flex-col gap-1 text-sm">
      <span class="opacity-70">Repository folders <span class="opacity-50">(optional)</span></span>
      {#if createForm.repos.length > 0}
        <ul class="flex flex-col gap-1">
          {#each createForm.repos as repo (repo)}
            <li class="flex items-center gap-2">
              <span class="grow truncate font-mono text-xs">{repo}</span>
              <Button type="link" title="Remove this folder" on:click={() => removeRepo(repo)}>Remove</Button>
            </li>
          {/each}
        </ul>
      {/if}
      <div>
        <Button type="secondary" on:click={() => request({ kind: 'pickFolder' })}>Add folder…</Button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label class="flex flex-col gap-1 text-sm">
        <span class="opacity-70">Color</span>
        <Dropdown bind:value={createForm.color} options={colorOptions} />
      </label>
      <label class="flex flex-col gap-1 text-sm">
        <span class="opacity-70">Engine</span>
        <Dropdown bind:value={createForm.engine} options={engineOptions} />
      </label>
      <label class="flex flex-col gap-1 text-sm">
        <span class="opacity-70">Memory</span>
        <Input placeholder="e.g. 2g" bind:value={createForm.memory} />
      </label>
      <label class="flex flex-col gap-1 text-sm">
        <span class="opacity-70">CPUs</span>
        <Input placeholder="e.g. 2" bind:value={createForm.cpus} />
      </label>
      <label class="flex flex-col gap-1 text-sm">
        <span class="opacity-70">Hardening</span>
        <Dropdown bind:value={createForm.harden} options={hardenOptions} />
      </label>
    </div>

    <div class="flex flex-col gap-2">
      <Checkbox bind:checked={createForm.dev}>Install dev tools (--dev)</Checkbox>
      <Checkbox bind:checked={createForm.noSudo}>Disable in-box passwordless sudo (--no-sudo)</Checkbox>
    </div>
  </div>

  <div class="flex items-center gap-2">
    <Button type="primary" disabled={!canSubmit} on:click={submit}>Create box</Button>
    <Button type="secondary" disabled={createForm.submitting} on:click={resetCreateForm}>Cancel</Button>
    {#if createForm.submitting}
      <span class="flex items-center gap-2 text-sm opacity-70"><Spinner size="1em" /> Creating…</span>
    {/if}
  </div>
</div>
