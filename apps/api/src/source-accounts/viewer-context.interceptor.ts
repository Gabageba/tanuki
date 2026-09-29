import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';
import { VIEWER_KIND, type Viewer } from './models';
import { runAsViewer } from './viewer-context';

/**
 * Кладёт зрителя запроса в AsyncLocalStorage — оттуда его читает ParsersClientService, не
 * заставляя протаскивать пользователя через каждый сервис между контроллером и парсером.
 * Работает после AuthGuard, поэтому request.user уже разобран.
 */
@Injectable()
export class ViewerContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const viewer: Viewer = request.user
      ? { kind: VIEWER_KIND.USER, userId: request.user.id }
      : { kind: VIEWER_KIND.GUEST };

    return new Observable((subscriber) =>
      runAsViewer(viewer, () => next.handle().subscribe(subscriber)),
    );
  }
}
