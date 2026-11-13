/**
 * Process-level memory is intentionally sampled on scrape, rather than allocating an
 * interval/timer in the API. RSS includes native allocations (Sharp, buffers, etc.).
 * Values use bytes, as required by Prometheus process memory gauges.
 */
export const renderProcessMemoryMetrics = (): string => {
  const { rss, heapUsed, heapTotal, external, arrayBuffers } = process.memoryUsage();
  return [
    '# HELP tanuki_process_memory_bytes Node.js process memory by component in bytes',
    '# TYPE tanuki_process_memory_bytes gauge',
    `tanuki_process_memory_bytes{component="rss"} ${rss}`,
    `tanuki_process_memory_bytes{component="heap_used"} ${heapUsed}`,
    `tanuki_process_memory_bytes{component="heap_total"} ${heapTotal}`,
    `tanuki_process_memory_bytes{component="external"} ${external}`,
    `tanuki_process_memory_bytes{component="array_buffers"} ${arrayBuffers}`,
    '',
  ].join('\n');
};
