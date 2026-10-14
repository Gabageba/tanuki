import { Divider, Group, Stack, Text, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import SectionNav from '../components/SectionNav';
import { SECTION_GROUPS } from './models';
import AllSourcesSection from './sections/AllSourcesSection';
import ContinueSection from './sections/ContinueSection';
import EmptySection from './sections/EmptySection';
import EntriesSection from './sections/EntriesSection';
import FillSection from './sections/FillSection';
import FooterSection from './sections/FooterSection';
import HeaderSection from './sections/HeaderSection';
import LinkSection from './sections/LinkSection';
import RemoveSection from './sections/RemoveSection';
import SettingsSection from './sections/SettingsSection';
import ShortSection from './sections/ShortSection';
import SkeletonSection from './sections/SkeletonSection';
import StepSection from './sections/StepSection';
import StructureSection from './sections/StructureSection';
import SummarySection from './sections/SummarySection';
import SwitchSection from './sections/SwitchSection';

/** Главная: макеты по «Вопросам к макетам» плана docs/plans/home-page.md. */
function PlaygroundHome() {
  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Главная</Title>
      </Group>
      <Stack gap="xs" maw={760}>
        <Text c="dimmed" fz="sm">
          Варианты по осям — итог собирается комбинацией (C1 + U1 + S1 + K1 + L1 + Z1 + A1 + H1 + B1
          + T1 + E1). Нового экрана «как сейчас» нет, поэтому нулевые варианты есть только у шапки
          (H0) и нижней панели (B0). Каждый вариант показан в ширине десктопа и в рамке телефона 375
          px, шапка — только на десктопе. Смотрите в обеих темах — переключите схему в шапке
          приложения.
        </Text>
        <Text c="dimmed" fz="sm">
          «Продолжить чтение» — шесть тайтлов с разных источников; подборки — Реманга, MangaLib (с
          короткими блоками) и Desu. «Убрать», тост с «Отменить», чипы блоков, переключатели и
          галочки настроек живые. Всё без пометки «Только песочница» показано так, как пойдёт в
          реализацию; обложки — случайные картинки.
        </Text>
      </Stack>
      <Group align="stretch" wrap="nowrap" gap="xl">
        <SectionNav groups={SECTION_GROUPS} />
        <Divider orientation="vertical" visibleFrom="lg" />
        <Stack gap={64} flex={1} miw={0}>
          <SummarySection />
          <StructureSection />
          <EntriesSection />
          <FillSection />
          <ContinueSection />
          <RemoveSection />
          <StepSection />
          <SwitchSection />
          <ShortSection />
          <LinkSection />
          <SkeletonSection />
          <AllSourcesSection />
          <HeaderSection />
          <FooterSection />
          <SettingsSection />
          <EmptySection />
        </Stack>
      </Group>
    </Stack>
  );
}

export default PlaygroundHome;
