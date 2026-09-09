import { Injectable } from '@nestjs/common';
import { and, eq, or, sql } from 'drizzle-orm';
import { MANGA_LINK_VERDICT, type MangaLinkVerdict } from '@tanuki/contracts';
import { StorageUnavailableException } from '../common/errors';
import { DatabaseService } from '../database/database.service';
import { mangaLinks } from '../database/schema';

export type MangaLink = {
  /** Id второй стороны связи относительно того тайтла, который спрашивали. */
  targetId: string;
  targetTitle: string;
  verdict: MangaLinkVerdict;
};

/**
 * Ключ стороны связи — «sourceId:адрес тайтла на источнике».
 *
 * Намеренно НЕ Manga.id: тот кодирует ещё и внутренний числовой id, а часть парсеров (desume,
 * например) выдаёт для одного тайтла разные id в списке и в деталях. Связь, записанная по
 * такому ключу, переставала находиться с одной из сторон. Адрес же стабилен — по нему тайтл и
 * запрашивается у источника.
 */
export const linkKeyOf = (sourceId: string, url: string): string => `${sourceId}:${url}`;

export const parseLinkKey = (key: string): { sourceId: string; url: string } => {
  const separator = key.indexOf(':');
  return { sourceId: key.slice(0, separator), url: key.slice(separator + 1) };
};

/** Пара всегда хранится отсортированной — это и делает связь симметричной. */
export const orderPair = (left: string, right: string): [string, string] =>
  left <= right ? [left, right] : [right, left];

type LinkRow = {
  aId: string;
  bId: string;
  aTitle: string;
  bTitle: string;
  verdict: MangaLinkVerdict;
};

/**
 * Разворачивает хранимую строку относительно тайтла, о котором спрашивают: та сторона пары,
 * которой он не является, и есть искомая связь.
 */
export const toMangaLink = (row: LinkRow, mangaId: string): MangaLink => {
  const isA = row.aId === mangaId;
  return {
    targetId: isA ? row.bId : row.aId,
    targetTitle: isA ? row.bTitle : row.aTitle,
    verdict: row.verdict,
  };
};

@Injectable()
export class MangaLinksService {
  constructor(private readonly database: DatabaseService) {}

  /**
   * Все ручные правки, касающиеся тайтла, — независимо от того, с какой стороны их поставили.
   * При недоступной базе возвращает пустой список: без правок выдача матчинга всё ещё
   * осмысленна, а падать целиком из-за них незачем.
   */
  async listFor(mangaId: string): Promise<MangaLink[]> {
    return this.database.withFallback(async () => {
      const rows = await this.database.db
        .select()
        .from(mangaLinks)
        .where(or(eq(mangaLinks.aId, mangaId), eq(mangaLinks.bId, mangaId)));

      return rows.map((row) => toMangaLink(row, mangaId));
    }, []);
  }

  /**
   * Ставит или снимает пометку. MANGA_LINK_VERDICT.NONE удаляет запись, возвращая пару к тому,
   * что скажет алгоритм.
   *
   * В отличие от чтения, недоступность базы здесь превращается в ошибку: пользователь должен
   * узнать, что его правка не сохранилась.
   */
  async set(
    mangaId: string,
    mangaTitle: string,
    targetId: string,
    targetTitle: string,
    verdict: MangaLinkVerdict,
  ): Promise<void> {
    const [aId, bId] = orderPair(mangaId, targetId);
    const [aTitle, bTitle] =
      aId === mangaId ? [mangaTitle, targetTitle] : [targetTitle, mangaTitle];

    const applied = await this.database.withFallback(async () => {
      if (verdict === MANGA_LINK_VERDICT.NONE) {
        await this.database.db
          .delete(mangaLinks)
          .where(and(eq(mangaLinks.aId, aId), eq(mangaLinks.bId, bId)));
        return true;
      }

      await this.database.db
        .insert(mangaLinks)
        .values({ aId, bId, aTitle, bTitle, verdict })
        .onConflictDoUpdate({
          target: [mangaLinks.aId, mangaLinks.bId],
          set: { verdict, aTitle, bTitle, updatedAt: sql`now()` },
        });
      return true;
    }, false);

    if (!applied) throw new StorageUnavailableException();
  }
}
