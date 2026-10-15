import { Divider, Group, Stack, Text, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import SectionNav from '../components/SectionNav';
import DeleteSection from './sections/DeleteSection';
import EditHintSection from './sections/EditHintSection';
import RowSection from './sections/RowSection';
import SummarySection from './sections/SummarySection';
import { SECTION_GROUPS } from './models';

/** Строка папки в настройках закладок: тумблер и меню без пустого места у встроенных. */
function PlaygroundFolderRow() {
  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Строка папки в настройках</Title>
      </Group>
      <Stack gap="xs" maw={760}>
        <Text c="dimmed" fz="sm">
          У встроенных папок нет меню, поэтому в F1 справа от их тумблера пустое место — иначе
          тумблеры встанут вразнобой. Раздел V — первый круг: варианты устройства строки целиком.
          Оси E и D развивают V2 (меню нет, своя папка открывается кликом по строке) — итог
          собирается комбинацией, например E2 + D1.
        </Text>
        <Text c="dimmed" fz="sm">
          Каждый вариант показан на списке со своими папками, на списке из одних встроенных и в
          рамке телефона. Тумблеры, модалки, раскрытие, режим правки и перетаскивание в корзину
          живые; смотрите в обеих темах. Всё показано так, как пойдёт в реализацию.
        </Text>
      </Stack>
      <Group align="stretch" wrap="nowrap" gap="lg">
        <SectionNav groups={SECTION_GROUPS} />
        <Divider orientation="vertical" visibleFrom="md" />
        <Stack gap="xl" flex={1} miw={0}>
          <SummarySection />
          <RowSection />
          <EditHintSection />
          <DeleteSection />
        </Stack>
      </Group>
    </Stack>
  );
}

export default PlaygroundFolderRow;
