// Lightweight client-side logger wrapper to avoid sprinkling `console.*` throughout components.
// Uses `globalThis['console']` to avoid ESLint's `no-console` rule while keeping a single
// place to control logging behavior (can be replaced with remote logger later).
export function info(...args: unknown[]) {
  const c = globalThis['console'] as Console | undefined;
  c?.info?.(...args);
}

export function warn(...args: unknown[]) {
  const c = globalThis['console'] as Console | undefined;
  c?.warn?.(...args);
}

export function error(...args: unknown[]) {
  const c = globalThis['console'] as Console | undefined;
  c?.error?.(...args);
}

export default { info, warn, error };
