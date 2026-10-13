import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Живая страница или ответ источника, урезанный до нужного тесту, — из test/fixtures. */
export const readFixture = (name: string): string =>
  readFileSync(join(__dirname, '..', 'fixtures', name), 'utf-8');
