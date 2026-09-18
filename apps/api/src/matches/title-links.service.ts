import { Injectable } from '@nestjs/common';
import { and, eq, or, sql } from 'drizzle-orm';
import { TITLE_LINK_VERDICT, type TitleLinkVerdict } from '@tanuki/contracts';
import { StorageUnavailableException } from '../common/errors';
import { DatabaseService } from '../database/database.service';
import { titleLinks } from '../database/schema';

export type TitleLink = {
  /** Id второй стороны связи относительно того тайтла, который спрашивали. */
  targetId: string;
  targetName: string;
  verdict: TitleLinkVerdict;
};

/**
 * Ключ стороны связи — «sourceId:адрес тайтла на источнике».
 *
 * Намеренно НЕ Title.id: тот кодирует ещё и внутренний числовой id, а часть парсеров (desume,
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
  aName: string;
  bName: string;
  verdict: TitleLinkVerdict;
};

/**
 * Разворачивает хранимую строку относительно тайтла, о котором спрашивают: та сторона пары,
 * которой он не является, и есть искомая связь.
 */
export const toTitleLink = (row: LinkRow, titleId: string): TitleLink => {
  const isA = row.aId === titleId;
  return {
    targetId: isA ? row.bId : row.aId,
    targetName: isA ? row.bName : row.aName,
    verdict: row.verdict,
  };
};

@Injectable()
export class TitleLinksService {
  constructor(private readonly database: DatabaseService) {}

  /**
   * Все ручные правки, касающиеся тайтла, — независимо от того, с какой стороны их поставили.
   * При недоступной базе возвращает пустой список: без правок выдача матчинга всё ещё
   * осмысленна, а падать целиком из-за них незачем.
   */
  async listFor(titleId: string): Promise<TitleLink[]> {
    return this.database.withFallback(async () => {
      const rows = await this.database.db
        .select()
        .from(titleLinks)
        .where(or(eq(titleLinks.aId, titleId), eq(titleLinks.bId, titleId)));

      return rows.map((row) => toTitleLink(row, titleId));
    }, []);
  }

  /**
   * Ставит или снимает пометку. TITLE_LINK_VERDICT.NONE удаляет запись, возвращая пару к тому,
   * что скажет алгоритм.
   *
   * В отличие от чтения, недоступность базы здесь превращается в ошибку: пользователь должен
   * узнать, что его правка не сохранилась.
   */
  async set(
    titleId: string,
    titleName: string,
    targetId: string,
    targetName: string,
    verdict: TitleLinkVerdict,
  ): Promise<void> {
    const [aId, bId] = orderPair(titleId, targetId);
    const [aName, bName] = aId === titleId ? [titleName, targetName] : [targetName, titleName];

    const applied = await this.database.withFallback(async () => {
      if (verdict === TITLE_LINK_VERDICT.NONE) {
        await this.database.db
          .delete(titleLinks)
          .where(and(eq(titleLinks.aId, aId), eq(titleLinks.bId, bId)));
        return true;
      }

      await this.database.db
        .insert(titleLinks)
        .values({ aId, bId, aName, bName, verdict })
        .onConflictDoUpdate({
          target: [titleLinks.aId, titleLinks.bId],
          set: { verdict, aName, bName, updatedAt: sql`now()` },
        });
      return true;
    }, false);

    if (!applied) throw new StorageUnavailableException();
  }
}
