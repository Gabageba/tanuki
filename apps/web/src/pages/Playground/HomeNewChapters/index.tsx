import { Divider, Group, Stack, Text, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import SectionNav from '../components/SectionNav';
import {
  META_VARIANTS,
  PREVIOUS_VARIANTS,
  RESULT_VARIANT,
  SECTION_GROUPS,
  VARIANTS,
} from './models';
import NewChapterComparison from './components/NewChapterComparison';

function PlaygroundHomeNewChapters() {
  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Карточки новых глав на главной</Title>
      </Group>
      <Text c="dimmed" fz="sm" maw={900}>
        Выбраны A9 + M2: только «(+2)» выделено цветом, начертание обычное; источник указан текстом
        без логотипа. Собранный итог — в конце страницы. Перед ним — M0–M3 на основе A9: сравнение
        мета-строк, в которых папка отделяется от источника разделителем, отсутствием логотипа или
        переносом папки вправо. Размеры карточек и обложки, отступы и порядок «мета → название»
        сохранены; нижняя строка оформлена как обычная мета. A0 — текущий вид, A3–A4 — спокойный
        текст, A5–A7 — бейджи. Все прежние варианты видны ниже, включая отклонённые A1–A2. В каждом
        блоке — короткое и длинное название, тайтл 18+ и карточка без обложки, номера и даты. Слева
        — блок шириной 820 px, справа — телефон 360 px; на узком экране они идут друг под другом.
        Переключатель темы — в шапке. Сам интерфейс показан так, как пойдёт в реализацию; обложки
        вымышленные, названия ведут на демонстрационные тайтлы. В M0–M3 также есть карточка без
        папки.
      </Text>
      <Group align="stretch" wrap="nowrap" gap="xl">
        <SectionNav groups={SECTION_GROUPS} />
        <Divider orientation="vertical" visibleFrom="md" />
        <Stack gap="xl" flex={1} miw={0}>
          <Title order={3} id="axis-A">
            Счётчик обновлений · выбран A9
          </Title>
          {VARIANTS.map((variant) => (
            <NewChapterComparison key={variant.code} variant={variant} />
          ))}
          <Title order={3} id="axis-P">
            Прежние варианты с изменением размера и порядка
          </Title>
          {PREVIOUS_VARIANTS.map((variant) => (
            <NewChapterComparison key={variant.code} variant={variant} />
          ))}
          <Title order={3} id="axis-M">
            Мета-строка · все варианты на основе A9
          </Title>
          {META_VARIANTS.map((variant) => (
            <NewChapterComparison key={variant.code} variant={variant} />
          ))}
          <Title order={3} id="axis-R">
            Итог · A9 + M2
          </Title>
          <NewChapterComparison variant={RESULT_VARIANT} />
        </Stack>
      </Group>
    </Stack>
  );
}

export default PlaygroundHomeNewChapters;
