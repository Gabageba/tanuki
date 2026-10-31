import { Divider, Group, Stack, Text, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import SectionNav from '../components/SectionNav';
import CounterSection from './sections/CounterSection';
import DoneSection from './sections/DoneSection';
import FolderStatesSection from './sections/FolderStatesSection';
import FoldersSection from './sections/FoldersSection';
import EmptyBookmarksSection from './sections/EmptyBookmarksSection';
import HeaderButtonSection from './sections/HeaderButtonSection';
import ImportedSection from './sections/ImportedSection';
import ListSection from './sections/ListSection';
import MappingSection from './sections/MappingSection';
import ProgressSection from './sections/ProgressSection';
import QuestionsSection from './sections/QuestionsSection';
import RowSection from './sections/RowSection';
import StatesSection from './sections/StatesSection';
import SummarySection from './sections/SummarySection';
import { SECTION_GROUPS } from './models';

/** Импорт из источника: макеты по «Вопросам к макетам» плана docs/plans/source-import.md. */
function PlaygroundSourceImport() {
  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Импорт из источника</Title>
      </Group>
      <Stack gap="xs" maw={760}>
        <Text c="dimmed" fz="sm">
          Шаг выбора — целыми папками сайта (F): тайтлов на нём нет, уже импортированное
          пропускается, конфликты — шагом «Вопросы». Состояния этого шага — в S.
        </Text>
        <Text c="dimmed" fz="sm">
          Ниже — отброшенный шаг «Тайтлы» с выбором по одному тайтлу, разобранный по осям: группы
          (L), счётчик (K), строка (R), уже импортированные (A), расхождение отметки (P), папка
          сайта → наша (M). Оставлен как запись решения.
        </Text>
        <Text c="dimmed" fz="sm">
          Модалки нарисованы прямо на странице, в ширине десктопа 440 px и телефона 375 px рядом.
          Они живые: снимайте папки — счётчики меняются, а «Далее» сменяется на «Импорт», когда
          среди выбранного не остаётся конфликтов. Смотрите в обеих темах. Всё на странице показано
          так, как пойдёт в реализацию.
        </Text>
      </Stack>
      <Group align="stretch" wrap="nowrap" gap="xl">
        <SectionNav groups={SECTION_GROUPS} />
        <Divider orientation="vertical" visibleFrom="lg" />
        <Stack gap={64} flex={1} miw={0}>
          <SummarySection />
          <FoldersSection />
          <FolderStatesSection />
          <ListSection />
          <CounterSection />
          <RowSection />
          <ImportedSection />
          <ProgressSection />
          <MappingSection />
          <StatesSection />
          <QuestionsSection />
          <DoneSection />
          <HeaderButtonSection />
          <EmptyBookmarksSection />
        </Stack>
      </Group>
    </Stack>
  );
}

export default PlaygroundSourceImport;
