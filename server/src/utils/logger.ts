export function timestamp() {
  return new Date().toISOString();
}

export function info(...args: any[]) {
  console.log('[INFO]', timestamp(), ...args, "it works");
}

export function warn(...args: any[]) {
  console.warn('[WARN]', timestamp(), ...args);
}

export function error(...args: any[]) {
  console.error('[ERROR]', timestamp(), ...args);
}
