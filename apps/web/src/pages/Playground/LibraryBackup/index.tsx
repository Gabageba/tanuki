import { Divider, Group, Stack, Text, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import SectionNav from '../components/SectionNav';
import AdviceSection from './sections/AdviceSection';
import CountersSection from './sections/CountersSection';
import DoneSection from './sections/DoneSection';
import FileSection from './sections/FileSection';
import FinalSection from './sections/FinalSection';
import HeaderSection from './sections/HeaderSection';
import ProfileSection from './sections/ProfileSection';
import QuestionsSection from './sections/QuestionsSection';
import ToneSection from './sections/ToneSection';
import { SECTION_GROUPS } from './models';

/** Резервная копия библиотеки: макеты по «Вопросам к макетам» плана docs/plans/library-backup.md. */
function PlaygroundLibraryBackup() {
  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Резервная копия библиотеки</Title>
      </Group>
      <Stack gap="xs" maw={760}>
        <Text c="dimmed" fz="sm">
          Вверху — итог: выбранная комбинация в двух вариантах деления сводки на шаги, её можно
          пройти до конца. Ниже — варианты по осям, из которых он собран: у каждого его состояния в
          ширине десктопа и рамка телефона 375 px. Смотрите в обеих темах — переключите схему в
          шапке приложения.
        </Text>
        <Text c="dimmed" fz="sm">
          Модалки нарисованы прямо на странице, чтобы варианты стояли рядом. Сводки в осях живые:
          ответы на вопросы и флажок настроек сразу меняют тон и показывают или прячут совет; там,
          где ось не разбирается, сводка собрана из T1 + H1 + S1 + Q1a + W1. Всё без пометки «Только
          песочница» показано так, как пойдёт в реализацию.
        </Text>
      </Stack>
      <Group align="stretch" wrap="nowrap" gap="xl">
        <SectionNav groups={SECTION_GROUPS} />
        <Divider orientation="vertical" visibleFrom="lg" />
        <Stack gap={64} flex={1} miw={0}>
          <FinalSection />
          <ProfileSection />
          <FileSection />
          <ToneSection />
          <HeaderSection />
          <CountersSection />
          <QuestionsSection />
          <AdviceSection />
          <DoneSection />
        </Stack>
      </Group>
    </Stack>
  );
}

export default PlaygroundLibraryBackup;
