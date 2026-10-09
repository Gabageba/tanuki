import { Divider, Group, Stack, Text, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import SectionNav from '../components/SectionNav';
import BadgeSection from './sections/BadgeSection';
import DismissSection from './sections/DismissSection';
import PushLayoutSection from './sections/PushLayoutSection';
import EmptySection from './sections/EmptySection';
import FilterSection from './sections/FilterSection';
import PaginationSection from './sections/PaginationSection';
import ResultSection from './sections/ResultSection';
import PushOfferSection from './sections/PushOfferSection';
import SeparationSection from './sections/SeparationSection';
import RowSection from './sections/RowSection';
import SettingsSection from './sections/SettingsSection';
import ToastSection from './sections/ToastSection';
import { SECTION_GROUPS } from './models';

/** Уведомления: макеты по «Вопросам к макетам» плана docs/plans/notifications.md. */
function PlaygroundNotifications() {
  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Уведомления</Title>
      </Group>
      <Stack gap="xs" maw={760}>
        <Text c="dimmed" fz="sm">
          Варианты по осям — итог собирается комбинацией (R1 + L1 + N1 + B3 + F1 + P1 + E3 + T1 + D1
          + Q1 + K1 + S1). Нового экрана «как сейчас» нет, поэтому базовый вариант есть только у
          бейджа (B0). Каждый вариант показан в ширине десктопа и в рамке телефона 375 px. Смотрите
          в обеих темах — переключите схему в шапке приложения.
        </Text>
        <Text c="dimmed" fz="sm">
          Лента — для админа, чтобы были видны все десять типов. Строки, фильтры, страницы и
          тумблеры живые. Всё без пометки «Только песочница» показано так, как пойдёт в реализацию;
          обложки — случайные картинки.
        </Text>
      </Stack>
      <Group align="stretch" wrap="nowrap" gap="lg">
        <SectionNav groups={SECTION_GROUPS} />
        <Divider orientation="vertical" visibleFrom="md" />
        <Stack gap="xl" flex={1} miw={0}>
          <ResultSection />
          <SeparationSection />
          <RowSection />
          <BadgeSection />
          <FilterSection />
          <PaginationSection />
          <EmptySection />
          <DismissSection />
          <ToastSection />
          <PushOfferSection />
          <PushLayoutSection />
          <SettingsSection />
        </Stack>
      </Group>
    </Stack>
  );
}

export default PlaygroundNotifications;
