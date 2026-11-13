import { describe, expect, it } from 'vitest';
import { renderProcessMemoryMetrics } from './process-memory-metrics';

describe('process memory metrics', () => {
  it('exposes bounded-cardinality, numeric byte gauges for the current process', () => {
    const output = renderProcessMemoryMetrics();
    expect(output).toContain('# TYPE tanuki_process_memory_bytes gauge');
    for (const component of ['rss', 'heap_used', 'heap_total', 'external', 'array_buffers']) {
      expect(output).toMatch(
        new RegExp(`tanuki_process_memory_bytes\\{component="${component}"\\} [0-9]+\\n`),
      );
    }
    expect(output).not.toContain('undefined');
    expect(output).not.toContain('NaN');
  });
});
