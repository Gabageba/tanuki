import { Divider, Group, Stack, Text, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import SectionNav from '../components/SectionNav';
import ChapterIconSection from './sections/ChapterIconSection';
import DownloadedSection from './sections/DownloadedSection';
import EmptySection from './sections/EmptySection';
import InstallSection from './sections/InstallSection';
import IosHintSection from './sections/IosHintSection';
import ModalSection from './sections/ModalSection';
import OfflineCatalogSection from './sections/OfflineCatalogSection';
import OfflineRowSection from './sections/OfflineRowSection';
import OfflineSignalSection from './sections/OfflineSignalSection';
import PlateSection from './sections/PlateSection';
import ProfileSection from './sections/ProfileSection';
import QueueSection from './sections/QueueSection';
import ResultSection from './sections/ResultSection';
import SettingsSection from './sections/SettingsSection';
import UnavailableSection from './sections/UnavailableSection';
import UpdateSection from './sections/UpdateSection';
import { SECTION_GROUPS } from './models';

/** Скачивание глав и офлайн: макеты по «Вопросам к макетам» плана docs/plans/offline-downloads.md. */
function PlaygroundOfflineDownloads() {
  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Скачивание глав и офлайн</Title>
      </Group>
      <Stack gap="xs" maw={760}>
        <Text c="dimmed" fz="sm">
          Варианты по осям — итог собирается комбинацией (C1 + D1 + B1 + M1 + …). Там, где меняется
          раскладка («Загрузки», индикация «Нет сети», каталог, установка), вариант показан в ширине
          десктопа и в рамке телефона 375 px; остальное — в одной ширине. Смотрите в обеих темах —
          переключите схему в шапке приложения.
        </Text>
        <Text c="dimmed" fz="sm">
          Списки глав, очередь, модалки и меню живые. Модалки нарисованы прямо на странице, чтобы
          варианты стояли рядом. Всё без пометки «Только песочница» показано так, как пойдёт в
          реализацию; обложки — случайные картинки.
        </Text>
      </Stack>
      <Group align="stretch" wrap="nowrap" gap="xl">
        <SectionNav groups={SECTION_GROUPS} />
        <Divider orientation="vertical" visibleFrom="lg" />
        <Stack gap={64} flex={1} miw={0}>
          <ResultSection />
          <ChapterIconSection />
          <OfflineRowSection />
          <PlateSection />
          <ModalSection />
          <QueueSection />
          <DownloadedSection />
          <EmptySection />
          <ProfileSection />
          <SettingsSection />
          <OfflineSignalSection />
          <UnavailableSection />
          <OfflineCatalogSection />
          <UpdateSection />
          <InstallSection />
          <IosHintSection />
        </Stack>
      </Group>
    </Stack>
  );
}

export default PlaygroundOfflineDownloads;
