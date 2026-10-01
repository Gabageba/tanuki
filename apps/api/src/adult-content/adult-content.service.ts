import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  CONTENT_RATING,
  DEFAULT_HIDE_ADULT_TITLES,
  DEFAULT_SHOW_ADULT_SOURCES,
  catalogEntryFor,
  type ContentRating,
} from '@tanuki/contracts';
import { AdultContentHiddenException } from '../common/errors';
import { DatabaseService } from '../database/database.service';
import { userSettings } from '../database/schema';
import { VIEWER_KIND, type Viewer } from '../source-accounts/models';
import { getViewer } from '../source-accounts/viewer-context';

/** Что зрителю открыто из контента 18+ — см. одноимённые поля UserSettings. */
export type AdultContentAccess = {
  showAdultSources: boolean;
  hideAdultTitles: boolean;
};

/** Гость и пользователь, который ещё ничего не выбирал. */
const DEFAULT_ACCESS: AdultContentAccess = {
  showAdultSources: DEFAULT_SHOW_ADULT_SOURCES,
  hideAdultTitles: DEFAULT_HIDE_ADULT_TITLES,
};

/** Фоновая работа (пробник, общий веер совпадений) ничьих настроек не знает и видит всё. */
const UNRESTRICTED_ACCESS: AdultContentAccess = { showAdultSources: true, hideAdultTitles: false };

const isAdultSource = (sourceId: string) => catalogEntryFor(sourceId).isAdult;

export const isAdultSourceHidden = (access: AdultContentAccess, sourceId: string) =>
  !access.showAdultSources && isAdultSource(sourceId);

/**
 * Настройки контента 18+ зрителя текущего запроса и проверки по ним. Две настройки не
 * пересекаются: showAdultSources решает судьбу источников с меткой 18+ целиком, hideAdultTitles —
 * тайтлов 18+ в остальных источниках, где они идут вперемешку с обычными.
 */
@Injectable()
export class AdultContentService {
  /** Настройки читаются из БД один раз на запрос: зритель запроса — один и тот же объект. */
  private readonly pending = new WeakMap<Viewer, Promise<AdultContentAccess>>();

  constructor(private readonly database: DatabaseService) {}

  getAccess(): Promise<AdultContentAccess> {
    const viewer = getViewer();
    if (viewer.kind === VIEWER_KIND.SERVICE) return Promise.resolve(UNRESTRICTED_ACCESS);
    if (viewer.kind === VIEWER_KIND.GUEST) return Promise.resolve(DEFAULT_ACCESS);

    let access = this.pending.get(viewer);
    if (!access) {
      access = this.load(viewer.userId);
      this.pending.set(viewer, access);
    }
    return access;
  }

  async assertSourceVisible(sourceId: string): Promise<void> {
    if (!isAdultSource(sourceId)) return;
    if (isAdultSourceHidden(await this.getAccess(), sourceId)) {
      throw new AdultContentHiddenException(sourceId);
    }
  }

  /** Тайтл источника 18+ сюда доходит, только если сам источник зрителю открыт. */
  async assertTitleVisible(sourceId: string, contentRating: ContentRating | null): Promise<void> {
    if (contentRating !== CONTENT_RATING.ADULT || isAdultSource(sourceId)) return;
    if ((await this.getAccess()).hideAdultTitles) {
      throw new AdultContentHiddenException(sourceId, true);
    }
  }

  /** Недоступная база — умолчания: лучше спрятать лишнее, чем показать скрытое. */
  private load(userId: string): Promise<AdultContentAccess> {
    return this.database.withFallback(async () => {
      const [row] = await this.database.db
        .select({
          showAdultSources: userSettings.showAdultSources,
          hideAdultTitles: userSettings.hideAdultTitles,
        })
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);
      return {
        showAdultSources: row?.showAdultSources ?? DEFAULT_ACCESS.showAdultSources,
        hideAdultTitles: row?.hideAdultTitles ?? DEFAULT_ACCESS.hideAdultTitles,
      };
    }, DEFAULT_ACCESS);
  }
}
