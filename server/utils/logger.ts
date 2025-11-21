// Lightweight logger that avoids using `console` so projects with strict
export function formatArgs(args: unknown[]) {
  return args
    .map(a => {
      if (a instanceof Error) return `${a.name}: ${a.message}\n${a.stack}`;
      try {
        return typeof a === 'string' ? a : JSON.stringify(a);
      } catch {
        return String(a);
      }
    })
    .join(' ');
}

export function info(...args: unknown[]) {
  const prefix = `[INFO] ${new Date().toISOString()}`;
  process.stdout.write(`${prefix} ${formatArgs(args)}\n`);
}

export function warn(...args: unknown[]) {
  const prefix = `[WARN] ${new Date().toISOString()}`;
  process.stderr.write(`${prefix} ${formatArgs(args)}\n`);
}

export function error(...args: unknown[]) {
  const prefix = `[ERROR] ${new Date().toISOString()}`;
  process.stderr.write(`${prefix} ${formatArgs(args)}\n`);
}

export default { info, warn, error };
