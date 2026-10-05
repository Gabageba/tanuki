import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { USER_ROLE } from '@tanuki/contracts';
import { ROLES_KEY } from '../auth/roles.decorator';
import { SourceProbeController } from './source-probe.controller';

describe('SourceProbeController', () => {
  it('ручную проверку запускает только персонал', () => {
    expect(Reflect.getMetadata(ROLES_KEY, SourceProbeController)).toEqual([
      USER_ROLE.ADMIN,
      USER_ROLE.MODERATOR,
    ]);
  });
});
