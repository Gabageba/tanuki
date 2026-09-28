import { useEffect, useMemo, useState } from 'react';
import { Box, Container, Divider, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { SORT_DIRECTION, type SortDirection } from '@tanuki/contracts';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import {
  APPROXIMATE_STYLE,
  type ApproximateStyle,
  type DemoState,
  type PlacedMark,
  type StackSize,
} from './models';
import { buildChapters, placeMark } from './lib';
import { DEMO_BRANCHES, OWN_MARK, getDemoMarks } from './mocks';
import DemoControls from './components/DemoControls';
import DemoSection from '../components/DemoSection';
import SummaryStackPopover from './components/SummaryStackPopover';
import SummaryStackCaption from './components/SummaryStackCaption';
import SummaryButtonStack from './components/SummaryButtonStack';
import SummaryCollapse from './components/SummaryCollapse';
import SummarySplitButton from './components/SummarySplitButton';
import RowsStackRight from './components/RowsStackRight';
import RowsStackNode from './components/RowsStackNode';
import RowsDots from './components/RowsDots';
import RowsTextChip from './components/RowsTextChip';
import RowsGitLanes from './components/RowsGitLanes';
import RowsStackNearNode from './components/RowsStackNearNode';
import RowsStackBranch from './components/RowsStackBranch';
import RowsBranchCounter from './components/RowsBranchCounter';
import RowsBranchLeft from './components/RowsBranchLeft';
import RowsBranchVertical from './components/RowsBranchVertical';
import RowsBranchDot from './components/RowsBranchDot';
import RowsBranchFinal from './components/RowsBranchFinal';
import RowsNodeBadge from './components/RowsNodeBadge';
import RowsStackGutter from './components/RowsStackGutter';
import RowsDivider from './components/RowsDivider';
import RowsSubline from './components/RowsSubline';
import RowsDateSwap from './components/RowsDateSwap';
import RowsRail from './components/RowsRail';
import RowsPerspective from './components/RowsPerspective';
import RowsReadElsewhere from './components/RowsReadElsewhere';
import PlayerBar from './components/PlayerBar';
import SourceRace from './components/SourceRace';
import ChapterGrid from './components/ChapterGrid';
import ProgressRing from './components/ProgressRing';
import RowsSections from './components/RowsSections';
import RowsRibbons from './components/RowsRibbons';
import RowsCoverage from './components/RowsCoverage';

/** Сколько держится подсветка главы, к которой перешли из сводки. */
const HIGHLIGHT_DURATION_MS = 2000;

const MOBILE_WIDTH = 375;

/**
 * Макеты отметок других источников: сводка под «Продолжить» (S1–S5) и строка главы (A–K, A1–A4) на
 * одних и тех же моках. Панель сверху меняет ветку, сортировку, стиль примерного места и сколько
 * источников сходятся на одной главе.
 */
function PlaygroundReadingMarks() {
  const [branchId, setBranchId] = useState(DEMO_BRANCHES[0]?.id ?? '');
  const [direction, setDirection] = useState<SortDirection>(SORT_DIRECTION.DESC);
  const [approximateStyle, setApproximateStyle] = useState<ApproximateStyle>(
    APPROXIMATE_STYLE.QUESTION_BADGE,
  );
  const [withLegend, setWithLegend] = useState(false);
  const [stackSize, setStackSize] = useState<StackSize>(2);
  const [isMobile, setIsMobile] = useState(false);
  const [highlightedChapterId, setHighlightedChapterId] = useState<string>();

  useEffect(() => {
    if (!highlightedChapterId) return;
    const timeout = setTimeout(() => setHighlightedChapterId(undefined), HIGHLIGHT_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [highlightedChapterId]);

  const demo = useMemo<DemoState>(() => {
    const branch = DEMO_BRANCHES.find((item) => item.id === branchId) ?? DEMO_BRANCHES[0]!;
    const readingOrder = buildChapters(branch);
    const chapters = direction === SORT_DIRECTION.DESC ? [...readingOrder].reverse() : readingOrder;
    const marks = getDemoMarks(stackSize);

    return {
      chapters,
      direction,
      approximateStyle,
      withLegend,
      own: placeMark(OWN_MARK, branch.id, chapters),
      placed: marks.flatMap((mark): PlacedMark[] => {
        const placed = placeMark(mark, branch.id, chapters);
        return placed ? [placed] : [];
      }),
      marks,
      highlightedChapterId,
      onGoToChapter: (chapterId, scope) => {
        setHighlightedChapterId(chapterId);
        (scope ?? document)
          .querySelector(`[data-chapter-id="${chapterId}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
    };
  }, [approximateStyle, branchId, direction, highlightedChapterId, stackSize, withLegend]);

  const gridCols = isMobile ? { base: 1, md: 2, xl: 3 } : { base: 1, lg: 2 };
  const variantWidth = isMobile ? MOBILE_WIDTH : undefined;

  return (
    <Container py="md" size="xl">
      <Stack gap="lg">
        <Group gap="xs">
          <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
          <Title order={2}>Отметки других источников</Title>
        </Group>
        <Text c="dimmed" fz="sm" maw={760}>
          Своя отметка — на ReadManga, Т. 1 Гл. 6. Ещё читали на Inkstory, MangaLib, Remanga,
          MangaBuff и Senkuro. У двух веток разная нумерация: в «Команде Ронин» главы по томам, во
          второй — сквозные, поэтому та же глава называется то «Т. 2 Гл. 4», то «Гл. 10». Место
          Remanga и MangaBuff перенесено примерно, для Senkuro места не нашлось. «К главе» в сводке
          прокручивает к строке и подсвечивает её. Наведите на иконку — подсказка скажет, точное ли
          место.
        </Text>
        <DemoControls
          branches={DEMO_BRANCHES}
          branchId={branchId}
          onBranchChange={setBranchId}
          direction={direction}
          onDirectionChange={setDirection}
          approximateStyle={approximateStyle}
          onApproximateStyleChange={setApproximateStyle}
          stackSize={stackSize}
          onStackSizeChange={setStackSize}
          withLegend={withLegend}
          onLegendChange={setWithLegend}
          isMobile={isMobile}
          onMobileChange={setIsMobile}
        />

        <Divider label="Сводка под «Продолжить»" labelPosition="left" />
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
          <DemoSection
            code="S1"
            title="Стопка + поповер"
            description="Под кнопкой — только иконки всех источников, свежие первыми. Всё остальное — по тапу."
          >
            <SummaryStackPopover demo={demo} />
          </DemoSection>
          <DemoSection
            code="S2"
            title="Стопка с подписью"
            description="Рядом с иконками — главное: какой источник ушёл дальше своей отметки. Тап — тот же поповер."
          >
            <SummaryStackCaption demo={demo} />
          </DemoSection>
          <DemoSection
            code="S3"
            title="Стопка внутри кнопки"
            description="Иконки в правой части «Продолжить», отдельной строки нет. Тап по иконкам — поповер."
          >
            <SummaryButtonStack demo={demo} />
          </DemoSection>
          <DemoSection
            code="S4"
            title="Раскрывающийся список"
            description="Иконки со стрелкой раскрывают список прямо в шапке — на мобилке удобнее поповера."
          >
            <SummaryCollapse demo={demo} />
          </DemoSection>
          <DemoSection
            code="S5"
            title="Split-кнопка"
            description="«Продолжить | ▾»: в меню каждый источник — продолжить с его места."
          >
            <SummarySplitButton demo={demo} />
          </DemoSection>
        </SimpleGrid>

        <Divider label="Без таймлайна" labelPosition="left" />
        <SimpleGrid cols={gridCols} spacing="xl">
          <DemoSection
            code="L"
            title="Шкала как у плеера"
            description="Одна полоса на весь тайтл, как в видеоплеере: залито своё, штриховка — дочитано на других, над полосой булавки источников. В строках списка ни линии, ни иконок. Тап по булавке — к главе."
          >
            <Box w={variantWidth}>
              <PlayerBar demo={demo} />
            </Box>
          </DemoSection>
          <DemoSection
            code="M"
            title="Гонка источников"
            description="Каждый источник — своя полоса длиной в прочитанное в этой ветке, сверху кто дальше. У чужих — «+4» / «−2» относительно вас, примерное место заштриховано. Тап — к главе."
          >
            <Box w={variantWidth}>
              <SourceRace demo={demo} />
            </Box>
          </DemoSection>
          <DemoSection
            code="N"
            title="Сетка глав"
            description="Клетка на главу, строка на том, как GitHub-календарь. Залита — прочитано, пунктир — дочитано на другом источнике, в углу — кто там остановился. 300 глав — пара экранов."
          >
            <Box w={variantWidth}>
              <ChapterGrid demo={demo} />
            </Box>
          </DemoSection>
          <DemoSection
            code="O"
            title="Разделы"
            description="Вместо линии — разделы «Не прочитано», «Прочитано на Inkstory, MangaLib», «Прочитано здесь» (свёрнут). Кто где остановился — видно по заголовкам."
          >
            <Box w={variantWidth}>
              <RowsSections demo={demo} />
            </Box>
          </DemoSection>
          <DemoSection
            code="Q"
            title="Кольцо"
            description="Для шапки рядом с обложкой: «6 из 12» в центре, дуга своего прогресса и светлая — до дальней чужой, иконки источников снаружи по кругу, рядом — список отметок."
          >
            <Box w={variantWidth}>
              <ProgressRing demo={demo} />
            </Box>
          </DemoSection>
        </SimpleGrid>

        <Divider label="Переработанный таймлайн" labelPosition="left" />
        <SimpleGrid cols={gridCols} spacing="xl">
          <DemoSection
            code="P"
            title="Корешок и закладки"
            description="Кругов нет: у края толстая полоса-корешок, из края торчат закладки-ленточки цвета источника, своя — акцентная. Как настоящие закладки в книге."
          >
            <Box w={variantWidth}>
              <RowsRibbons demo={demo} />
            </Box>
          </DemoSection>
          <DemoSection
            code="R"
            title="Покрытие в узле"
            description="Узел — доля источников, где глава прочитана: полный круг — везде, сектор — частично. Где сектор убывает, кто-то остановился. Наведите — кто прочитал."
          >
            <Box w={variantWidth}>
              <RowsCoverage demo={demo} />
            </Box>
          </DemoSection>
        </SimpleGrid>

        <Divider label="Строка главы: новые подходы" labelPosition="left" />
        <SimpleGrid cols={gridCols} spacing="xl">
          <DemoSection
            code="F"
            title="Разделитель «здесь остановились»"
            description="Строки не меняются. Между главой, где остановились, и следующей — тонкая черта с иконками, как «Новые сообщения» в чате. Пунктир — место примерное."
          >
            <Box w={variantWidth}>
              <RowsDivider demo={demo} />
            </Box>
          </DemoSection>
          <DemoSection
            code="G"
            title="Вторая строка"
            description="Под названием — мелкая строка: иконка и имя каждого источника, «≈» у примерных. Ничего не надо угадывать по иконкам, строка выше только там, где отметки."
          >
            <Box w={variantWidth}>
              <RowsSubline demo={demo} />
            </Box>
          </DemoSection>
          <DemoSection
            code="H"
            title="Миникарта сбоку"
            description="Строки не меняются. Справа — полоса во всю высоту списка, как метки поиска на скроллбаре: своя отметка и чужие иконки по доле в списке. Тап — прокрутка к главе."
          >
            <Box w={variantWidth}>
              <RowsRail demo={demo} />
            </Box>
          </DemoSection>
          <DemoSection
            code="I"
            title="Точка зрения"
            description="Чипы «Я» и источники над списком. Выбрали источник — таймлайн показывает прогресс, как будто читали там. Сравнивают переключением, в строках пусто."
          >
            <Box w={variantWidth}>
              <RowsPerspective demo={demo} />
            </Box>
          </DemoSection>
          <DemoSection
            code="J"
            title="Прочитано где-то ещё"
            description="Не отметки, а продолжение таймлайна: от своей главы до самой дальней чужой — пунктир и пунктирные круги. Отметки позади своей скрыты — те главы и так прочитаны."
          >
            <Box w={variantWidth}>
              <RowsReadElsewhere demo={demo} />
            </Box>
          </DemoSection>
          <DemoSection
            code="K"
            title="Вместо даты"
            description="В строке с отметкой дата загрузки уступает место иконкам и «когда там читали». Ширина строки и название не меняются."
          >
            <Box w={variantWidth}>
              <RowsDateSwap demo={demo} />
            </Box>
          </DemoSection>
        </SimpleGrid>

        <Divider label="Строка главы: A и доработки" labelPosition="left" />
        <SimpleGrid cols={gridCols} spacing="xl">
          <DemoSection
            code="A"
            title="Круг + стопка справа"
            description="Узел — всегда круг своего прогресса. Чужие отметки — стопкой иконок после названия."
          >
            <Box w={variantWidth}>
              <RowsStackRight demo={demo} />
            </Box>
          </DemoSection>
          <DemoSection
            code="A1"
            title="Стопка у узла"
            description="Иконки сразу за кругом, перед номером главы. Слот есть и в пустых строках — стопки встают одной колонкой вдоль линии."
          >
            <Box w={variantWidth}>
              <RowsStackNearNode demo={demo} />
            </Box>
          </DemoSection>
          <DemoSection
            code="A2"
            title="Ответвление от узла"
            description="Как A1, но от круга к стопке тянется ветка, пунктирная, если все отметки на главе примерные. Ширина слота считается по списку — под самую большую стопку в ветке; нет отметок — нет слота."
          >
            <Box w={variantWidth}>
              <RowsStackBranch demo={demo} />
            </Box>
          </DemoSection>
          <DemoSection
            code="A2a"
            title="Ветка + одна иконка"
            description="На конце ветки — свежий источник и счётчик «+N», остальные в поповере. Слот — ветка и одна иконка, при любом числе источников."
          >
            <Box w={variantWidth}>
              <RowsBranchCounter demo={demo} />
            </Box>
          </DemoSection>
          <DemoSection
            code="A2b"
            title="Ветка влево"
            description="Ветка уходит от круга в левый отступ строки, на конце — иконка и «+N». Номер и название главы не сдвигаются совсем."
          >
            <Box w={variantWidth}>
              <RowsBranchLeft demo={demo} />
            </Box>
          </DemoSection>
          <DemoSection
            code="A2c"
            title="Иконки столбиком"
            description="Иконки по 14px идут вдоль линии, а не поперёк: ширина слота — одна иконка. Третий и дальше — в «+N»."
          >
            <Box w={variantWidth}>
              <RowsBranchVertical demo={demo} />
            </Box>
          </DemoSection>
          <DemoSection
            code="A2d"
            title="Точка у линии, иконки справа"
            description="У линии только короткая ветка с точкой, сами иконки — перед датой и только в строках с отметками."
          >
            <Box w={variantWidth}>
              <RowsBranchDot demo={demo} />
            </Box>
          </DemoSection>
          <DemoSection
            code="A2e"
            title="Ветка + одна иконка, финал"
            description="Как A2a, но ветка короткая — только через отступ, как в A2b. Своя отметка обведена кольцом, как в R."
          >
            <Box w={variantWidth}>
              <RowsBranchFinal demo={demo} />
            </Box>
          </DemoSection>
          <DemoSection
            code="A3"
            title="Бейдж на узле"
            description="Круг остаётся, в его углу — свежий источник и «+N». Самый компактный, но иконки мелкие."
          >
            <Box w={variantWidth}>
              <RowsNodeBadge demo={demo} />
            </Box>
          </DemoSection>
          <DemoSection
            code="A4"
            title="Колонка слева от линии"
            description="Чужие места — слева от таймлайна, главы — справа. Только здесь работает стиль «Диапазон»: скобка охватывает соседние главы."
          >
            <Box w={variantWidth}>
              <RowsStackGutter demo={demo} />
            </Box>
          </DemoSection>
        </SimpleGrid>

        <Divider label="Отклонённые" labelPosition="left" />
        <SimpleGrid cols={gridCols} spacing="xl">
          <DemoSection
            code="B"
            title="Стопка вместо узла"
            description="Иконки заменяют круг на линии, в строке больше ничего. На своей главе узел остаётся кругом."
          >
            <Box w={variantWidth}>
              <RowsStackNode demo={demo} />
            </Box>
          </DemoSection>
          <DemoSection
            code="C"
            title="Точки + легенда"
            description="У линии — цветные точки источников, чей цвет — в легенде над списком."
          >
            <Box w={variantWidth}>
              <RowsDots demo={demo} />
            </Box>
          </DemoSection>
          <DemoSection
            code="D"
            title="Текстовый чип"
            description="После названия — чип с названиями источников, без иконок."
          >
            <Box w={variantWidth}>
              <RowsTextChip demo={demo} />
            </Box>
          </DemoSection>
          <DemoSection
            code="E"
            title="Git-ветви"
            description="У каждого источника своя дорожка от первой главы до места, где остановились, с иконкой на конце."
          >
            <Box w={variantWidth}>
              <RowsGitLanes demo={demo} />
            </Box>
          </DemoSection>
        </SimpleGrid>
      </Stack>
    </Container>
  );
}

export default PlaygroundReadingMarks;
