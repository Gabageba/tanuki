import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@tanuki/contracts';

export const ROLES_KEY = 'roles';

/** Сужает доступ до перечисленных ролей — сама аутентификация всё ещё требуется AuthGuard'ом. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
