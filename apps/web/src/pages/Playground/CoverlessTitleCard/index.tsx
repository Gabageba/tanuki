import { useState } from 'react';
import { Divider, Group, Stack, Text, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import SectionNav from '../components/SectionNav';
import {
  DENSITY_VARIANTS,
  EXAMPLE_SET,
  FOLDER_VARIANTS,
  LAYOUT_VARIANTS,
  META_VARIANTS,
  SECTION_GROUPS,
  type ExampleSet,
} from './models';
import { getExamples, MONTH_EXAMPLES } from './mocks';
import CardAxis from './components/CardAxis';
import ExampleControls from './components/ExampleControls';
import PanelAxis from './components/PanelAxis';
import StatesAxis from './components/StatesAxis';
import RefinedFolderVariants from './components/RefinedFolderVariants';
import FinalSelection from './components/FinalSelection';

function PlaygroundCoverlessTitleCard() {
  const [exampleSet, setExampleSet] = useState<ExampleSet>(EXAMPLE_SET.REGULAR);
  const examples = getExamples(exampleSet);
  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Карточка тайтла без обложки</Title>
      </Group>
      <Stack gap="xs" maw={760}>
        <Text c="dimmed" fz="sm">
          Вверху собран итог C2 + T1a + M9 + P2 + L2: папка слева от названия, 18+ справа, оба тега
          высотой 20 px. Ниже сохранены все варианты; M1–M10 находятся в разделе M.
        </Text>
        <Text c="dimmed" fz="sm">
          «Популярные» Nude-Moon по утверждённому плану coverless-title-card. Сравните плотность C,
          папку M, сведения T, панель P и колонки L. S — состояния выбранной анатомии. Это варианты
          для выбора одного вида, дополнительных режимов в приложении не будет.
        </Text>
        <Text c="dimmed" fz="sm">
          Общая база для M1–M4 и T — C2 + M2 + T1a. Меняется только соответствующая ось. В L показан
          вымышленный месяц из 12 тайтлов с C1. Десктоп — 720 px, раскладка L — 960 px; телефон —
          фиксированные 360 px. Рамки при нехватке места прокручиваются по горизонтали.
        </Text>
        <Text c="dimmed" fz="sm">
          Названия, описания, месяцы и выдачи вымышленные. В P переключаются месяц, сортировка и
          вкладки; «Новые переводы» показывают прежние карточки на тех же данных без обложек.
          Настройку скрытия изображений 18+ новый вид не использует. Всё без пометки «Только
          песочница» показано так, как пойдёт в реализацию.
        </Text>
      </Stack>
      <ExampleControls value={exampleSet} onChange={setExampleSet} />
      <Group align="stretch" wrap="nowrap" gap="xl">
        <SectionNav groups={SECTION_GROUPS} />
        <Divider orientation="vertical" visibleFrom="md" />
        <Stack gap="xl" flex={1} miw={0}>
          <FinalSelection examples={examples} />
          <CardAxis
            letter="C"
            title="Плотность карточки"
            variants={DENSITY_VARIANTS}
            examples={examples}
          />
          <CardAxis letter="M" title="Метка папки" variants={FOLDER_VARIANTS} examples={examples}>
            <RefinedFolderVariants examples={examples} />
          </CardAxis>
          <CardAxis
            letter="T"
            title="18+, лайки и теги"
            variants={META_VARIANTS}
            examples={examples}
          />
          <PanelAxis examples={examples} />
          <CardAxis
            letter="L"
            title="Колонки и полный месяц"
            variants={LAYOUT_VARIANTS}
            examples={MONTH_EXAMPLES}
            wide
          />
          <StatesAxis />
        </Stack>
      </Group>
    </Stack>
  );
}

export default PlaygroundCoverlessTitleCard;
