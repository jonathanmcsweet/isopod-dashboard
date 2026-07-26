<script lang="ts">
// A Podman Desktop-style breadcrumb ("Parent > Current"), matching the native
// detail pages (e.g. "Extensions > Extension Details") so nested views read the
// same as the rest of the app. The parent segment navigates back; the current
// segment is inert. Colors use the --pd-content-breadcrumb* variables the host
// injects.
interface Props {
  parent: string;
  title: string;
  onnavigate: () => void;
}
let { parent, title, onnavigate }: Props = $props();
</script>

<nav class="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
  <button
    type="button"
    class="cursor-pointer text-[var(--pd-content-breadcrumb,#a074c4)] hover:underline"
    onclick={onnavigate}
  >
    {parent}
  </button>
  <span class="text-[var(--pd-content-breadcrumb,#a074c4)] opacity-60">&gt;</span>
  <span class="text-[var(--pd-content-breadcrumb-2,#d4d4d4)]">{title}</span>
</nav>
