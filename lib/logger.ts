// Structured logger — namespace + color-coded DevTools output.
// Filter in Chrome DevTools Console by typing e.g. "[cloud]" or "[upload]".
// All logs kept in both dev and prod (by design).

const NS_COLORS: Record<string, string> = {
  cloud:  '#6366f1',
  store:  '#0ea5e9',
  upload: '#f59e0b',
  ai:     '#10b981',
  ui:     '#ec4899',
};

export function createLogger(namespace: string) {
  const color = NS_COLORS[namespace] ?? '#6b7280';
  const tag = `%c[${namespace}]`;
  const tagStyle = `color:${color};font-weight:bold;font-family:monospace`;

  return {
    debug:   (msg: string, ...args: unknown[]) =>
      console.debug(tag, tagStyle, msg, ...args),
    info:    (msg: string, ...args: unknown[]) =>
      console.info(tag, tagStyle, msg, ...args),
    warn:    (msg: string, ...args: unknown[]) =>
      console.warn(tag, tagStyle, msg, ...args),
    error:   (msg: string, ...args: unknown[]) =>
      console.error(tag, tagStyle, msg, ...args),
    time:    (label: string) =>
      console.time(`[${namespace}] ${label}`),
    timeEnd: (label: string) =>
      console.timeEnd(`[${namespace}] ${label}`),
    group:   (label: string) =>
      console.groupCollapsed(tag + ' ' + label, tagStyle),
    groupEnd: () => console.groupEnd(),
  };
}

export const cloudLog  = createLogger('cloud');
export const storeLog  = createLogger('store');
export const uploadLog = createLogger('upload');
export const aiLog     = createLogger('ai');
export const uiLog     = createLogger('ui');
