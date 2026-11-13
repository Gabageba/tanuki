export const request = async (url, options = {}) => {
  const headers = new Headers(options.headers);
  // Synchronous Docker commands block socket-close events while services stop or restart.
  // Keep each host-side check independent of connections to the previous service instance.
  headers.set('Connection', 'close');
  try {
    return await fetch(url, { ...options, headers });
  } catch (cause) {
    throw new Error(`E2E request failed: ${options.method ?? 'GET'} ${url}`, { cause });
  }
};
