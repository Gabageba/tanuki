import { Anchor, Group, Stack, Text, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import CardsSection from './sections/CardsSection';
import FoldersSection from './sections/FoldersSection';
import MarkersSection from './sections/MarkersSection';
import PageSection from './sections/PageSection';
import SummarySection from './sections/SummarySection';
import TitleSection from './sections/TitleSection';

const AXES = [
  { letter: 'Итог', title: 'выбранное' },
  { letter: 'C', title: 'карточка' },
  { letter: 'U', title: 'недоступная' },
  { letter: 'T', title: 'вкладки' },
  { letter: 'A', title: 'действия' },
  { letter: 'I', title: 'иконки' },
  { letter: 'E', title: 'состояния' },
  { letter: 'S', title: 'тайтл' },
  { letter: 'R', title: 'читалка' },
  { letter: 'K', title: 'каталог' },
  { letter: 'N', title: 'главы' },
  { letter: 'D', title: 'точка' },
  { letter: 'F', title: 'настройки' },
  { letter: 'P', title: 'модалка папки' },
  { letter: 'G', title: 'профиль' },
  { letter: 'M', title: 'склейка' },
];

/** Закладки: макеты по «Вопросам к макетам» плана docs/plans/bookmarks.md. */
function PlaygroundBookmarks() {
  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Закладки</Title>
      </Group>
      <Stack gap="xs" maw={760}>
        <Text c="dimmed" fz="sm">
          Варианты по осям — итог собирается комбинацией (C1 + T2 + S3 + …). Каждая ось отвечает на
          свой вопрос из плана; там, где есть что сравнивать, первым идёт «Как сейчас». Страница,
          поиск, карточки и читалка показаны и на десктопе, и в рамке телефона 375 px. Смотрите в
          обеих темах — переключите схему в шапке приложения.
        </Text>
        <Text c="dimmed" fz="sm">
          Меню, «В закладки», тумблеры и модалки живые. Всё без пометки «Только песочница» показано
          так, как пойдёт в реализацию; обложки — случайные картинки.
        </Text>
        <Group gap="xs">
          {AXES.map(({ letter, title }) => (
            <Anchor key={letter} href={`#axis-${letter}`} fz="sm" ff="monospace">
              {letter}
              <Text component="span" inherit ff="body" c="dimmed">
                {' '}
                {title}
              </Text>
            </Anchor>
          ))}
        </Group>
      </Stack>
      <SummarySection />
      <CardsSection />
      <PageSection />
      <TitleSection />
      <MarkersSection />
      <FoldersSection />
    </Stack>
  );
}

export default PlaygroundBookmarks;
