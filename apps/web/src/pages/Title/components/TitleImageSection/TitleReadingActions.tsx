import type { TitleReadingProgressResponse } from '@tanuki/contracts';
import useChapters from '@/entities/title/hooks/useChapters';
import useReadingProgress from '@/entities/title/hooks/useReadingProgress';
import QueryBlock from '@/shared/ui/QueryBlock';
import { toOptionalQuery } from '@/shared/ui/QueryBlock/lib';
import TitleReadingActionsSkeleton from './TitleReadingActionsSkeleton';
import TitleReadingButtons from './TitleReadingButtons';

/** Отметки нет: так же, как у тайтла, который ещё не читали. */
const NO_READING_PROGRESS: TitleReadingProgressResponse = { own: null, linked: [] };

type Props = {
  titleId: string;
};

/**
 * «Продолжить» по своей отметке или «Читать с начала», если её нет. Главы берутся из ветки своей
 * отметки: там, где читали, и надо продолжать. Если читали и на других источниках группы, кнопка
 * становится split-кнопкой: под стрелкой — каждый источник, продолжить с его места. Переносить
 * чужую отметку сюда или нет, пользователь решает сам.
 */
function TitleReadingActions({ titleId }: Props) {
  const progressQuery = useReadingProgress({ titleId });
  // Ветка известна только из отметки: без неё запрос ушёл бы в ветку по умолчанию и тут же
  // повторился бы в нужную.
  const chaptersQuery = useChapters({
    titleId,
    branch: progressQuery.data?.own?.branchId,
    enabled: !progressQuery.isPending,
  });

  // «Продолжить» или «Читать с начала» решает отметка — до неё любая кнопка была бы догадкой и
  // сменилась бы на глазах. Не загрузилась отметка — читать можно с начала.
  return (
    <QueryBlock
      query={[toOptionalQuery(progressQuery), chaptersQuery]}
      skeleton={<TitleReadingActionsSkeleton />}
    >
      {([progress, chaptersData]) => (
        <TitleReadingButtons
          titleId={titleId}
          progress={progress ?? NO_READING_PROGRESS}
          chaptersData={chaptersData}
        />
      )}
    </QueryBlock>
  );
}

export default TitleReadingActions;
