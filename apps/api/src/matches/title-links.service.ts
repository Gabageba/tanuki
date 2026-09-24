import { Injectable } from '@nestjs/common';
import { and, eq, or, sql } from 'drizzle-orm';
import { TITLE_LINK_VERDICT, type TitleLinkVerdict } from '@tanuki/contracts';
import { StorageUnavailableException } from '../common/errors';
import { DatabaseService } from '../database/database.service';
import { titleLinks } from '../database/schema';

/**
 * Предохранитель для обхода группы: настоящая группа — это один тайтл на нескольких источниках,
 * так что больше пары десятков ключей в ней не бывает. Упереться в лимит можно только из-за
 * ошибочных подтверждений, склеивших разные тайтлы в цепочку.
 */
const TITLE_GROUP_MAX_SIZE = 64;

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

/**
 * Прямой отказ сильнее цепочки подтверждений: если 1↔3 явно отмечено «не он», 3 не входит в
 * группу 1, даже если есть 1↔2↔3. Иначе «Не он» на карточке, найденной через цепочку, ничего бы
 * не делал — строка REJECTED легла бы в базу, а тайтл остался бы подтверждённым.
 */
export const excludeRejected = (groupKeys: string[], directLinks: TitleLink[]): string[] => {
  const rejected = new Set(
    directLinks
      .filter((link) => link.verdict === TITLE_LINK_VERDICT.REJECTED)
      .map((link) => link.targetId),
  );
  return groupKeys.filter((key) => !rejected.has(key));
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
   * Все тайтлы, связанные с этим цепочкой подтверждений: 1↔2 и 2↔3 значат, что 1, 2 и 3 — один
   * тайтл. Сам titleId в ответ не входит. Прямые отказы здесь не учитываются — их снимает
   * excludeRejected, потому что отказ касается только той пары, между которой поставлен.
   *
   * UNION (а не UNION ALL) отбрасывает уже посещённые ключи, поэтому обход кольца
   * 1↔2↔3↔1 заканчивается сам. База недоступна — пустая группа, как и в listFor.
   */
  async listGroup(titleId: string): Promise<string[]> {
    return this.database.withFallback(async () => {
      const rows = await this.database.db.execute<{ key: string }>(sql`
        WITH RECURSIVE title_group(key) AS (
          SELECT ${titleId}::text
          UNION
          SELECT CASE WHEN link.a_id = title_group.key THEN link.b_id ELSE link.a_id END
          FROM title_links AS link
          JOIN title_group ON link.a_id = title_group.key OR link.b_id = title_group.key
          WHERE link.verdict = ${TITLE_LINK_VERDICT.CONFIRMED}
        )
        SELECT key FROM title_group LIMIT ${TITLE_GROUP_MAX_SIZE}
      `);

      return rows.map((row) => row.key).filter((key) => key !== titleId);
    }, []);
  }

  /**
   * Подтверждённая группа тайтла за вычетом тех, кому он сам отказал напрямую. Именно этот
   * набор считается «тем же тайтлом» и в выдаче совпадений, и в прогрессе чтения.
   */
  async listConfirmedGroup(titleId: string): Promise<string[]> {
    const [group, directLinks] = await Promise.all([
      this.listGroup(titleId),
      this.listFor(titleId),
    ]);
    return excludeRejected(group, directLinks);
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
