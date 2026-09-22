import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Освобождает эндпоинт от глобального AuthGuard — без сессии он тоже отвечает. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
