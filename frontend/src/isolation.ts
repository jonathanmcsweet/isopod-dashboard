// Shared classification of a box's isolation tier (from isopod's `isolation` and
// `runtime` fields). Used by the status-cell glyph, the engine-column label, and
// the detail badge so they agree on wording, tooltip, and what counts as the
// stronger (accented) tier. Returns null when the CLI didn't report isolation
// (older isopod), so callers can fall back or render nothing.
export type IsolationKind = 'microvm' | 'sandbox' | 'container' | 'unknown';

export interface IsolationSpec {
  kind: IsolationKind;
  label: string; // the tier word, e.g. 'microVM'
  runtime: string; // cleaned runtime name (e.g. 'krun'), '' when it adds nothing
  title: string; // tooltip text
  accent: boolean; // true for microVM — its own guest kernel, worth highlighting
}

export function isolationSpec(isolation?: string, runtime?: string): IsolationSpec | null {
  const rt = runtime && runtime !== 'container' ? runtime : '';
  switch (isolation) {
    case 'microvm':
      return {
        kind: 'microvm',
        label: 'microVM',
        runtime: rt,
        title: `microVM — its own guest kernel${
          rt ? ` (${rt} runtime)` : ''
        }. Stronger isolation than a standard container.`,
        accent: true,
      };
    case 'sandbox':
      return {
        kind: 'sandbox',
        label: 'sandbox',
        runtime: rt,
        title: `Syscall-sandboxed runtime${rt ? ` (${rt})` : ''} — shared host kernel.`,
        accent: false,
      };
    case 'container':
      return {
        kind: 'container',
        label: 'container',
        runtime: '',
        title: 'Standard container — shares the host kernel.',
        accent: false,
      };
    case 'unknown':
      return {
        kind: 'unknown',
        label: rt || 'custom',
        runtime: '',
        title: `Custom runtime${rt ? `: ${rt}` : ''} — isolation tier unknown.`,
        accent: false,
      };
    default:
      return null; // field absent (older isopod)
  }
}
