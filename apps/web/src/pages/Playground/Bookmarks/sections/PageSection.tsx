import { Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import DemoSection from '../../components/DemoSection';
import AxisHeading from '../components/AxisHeading';
import BookmarksEmpty from '../components/BookmarksEmpty';
import BookmarksSkeleton from '../components/BookmarksSkeleton';
import FolderEmpty from '../components/FolderEmpty';
import FolderList from '../components/FolderList';
import PageDemo from '../components/PageDemo';
import PhoneFrame from '../components/PhoneFrame';
import SearchEmpty from '../components/SearchEmpty';
import { ACTIONS_PLACEMENT, BUILT_IN_STYLE, TAB_COUNTER } from '../models';

/** Оси T, A, I — страница /bookmarks; E — загрузка и пустые состояния. */
function PageSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="T"
        title="Полоса папок"
        description="Вкладки как в настройках: иконка папки в её цвете, название, число тайтлов. Активная вкладка — в ?folder=. «Читаю» и «Прочитано» с новыми главами, «Брошено» без отслеживания, «Перечитать…» — длинное название (обрезка, полностью в подсказке) и пустая папка — откройте её. На телефоне полоса листается вбок. Карточки здесь и ниже — C1."
      />
      <DemoSection
        code="T1"
        title="Только число тайтлов"
        description="Новое видно только на карточках внутри папки."
        pros={[
          'Самая короткая вкладка — на телефоне видно больше папок',
          'Нет второго числа рядом с первым',
        ]}
        cons={[
          'Чтобы узнать, где вышли главы, надо пройти все папки',
          'Точка в шапке говорит «есть новое», но не где',
        ]}
      >
        <PageDemo tabCounter={TAB_COUNTER.COUNT} actionsPlacement={ACTIONS_PLACEMENT.TABS} />
      </DemoSection>
      <DemoSection
        code="T2"
        title="Число и точка нового"
        description="На иконке папки — точка, если в ней есть закладки с новыми главами. Та же точка, что в шапке: она ведёт сюда."
        pros={[
          'Сразу видно, в какой папке новое',
          'Почти не удлиняет вкладку',
          'Продолжает точку из шапки',
        ]}
        cons={['Сколько нового — не сказано', 'Маленькая точка на цветной иконке теряется']}
      >
        <PageDemo tabCounter={TAB_COUNTER.COUNT_DOT} actionsPlacement={ACTIONS_PLACEMENT.TABS} />
      </DemoSection>
      <DemoSection
        code="T3"
        title="Число и «+N» тайтлов с новым"
        description="За числом тайтлов — акцентное «+N»: сколько закладок в папке с новыми главами."
        pros={['Видно и где, и сколько', 'Тот же язык «+N», что на карточке']}
        cons={[
          'Два числа рядом: «12 +4» легко прочитать как «16» или как «4 новые главы»',
          'Вкладка длиннее — на телефоне помещается меньше',
        ]}
      >
        <PageDemo tabCounter={TAB_COUNTER.COUNT_NEW} actionsPlacement={ACTIONS_PLACEMENT.TABS} />
      </DemoSection>

      <AxisHeading
        letter="A"
        title="«Новая папка» и ссылка на настройки"
        description="Полное управление папками — в настройках, на странице только быстрое создание и переход туда. Вкладки — T1."
      />
      <DemoSection
        code="A1"
        title="В конце полосы вкладок"
        description="Две иконки справа от вкладок, на линии полосы: «Новая папка» и шестерёнка «Управлять папками»."
        pros={[
          'Действия про папки стоят рядом с папками',
          'Строка поиска не теснится — на телефоне поиску больше места',
        ]}
        cons={[
          'Иконки без подписи — только тултип',
          'Когда вкладки не влезают, иконки отъедают место у полосы',
        ]}
      >
        <PageDemo tabCounter={TAB_COUNTER.COUNT} actionsPlacement={ACTIONS_PLACEMENT.TABS} />
      </DemoSection>
      <DemoSection
        code="A2"
        title="Справа в строке поиска"
        description="На десктопе — кнопка «Новая папка» с подписью и шестерёнка, на телефоне — две иконки после сортировки."
        pros={['На десктопе действие подписано', 'Полоса вкладок целиком отдана папкам']}
        cons={[
          'На телефоне поиск сжимается до огрызка',
          'Создание папки смешано с поиском и сортировкой списка',
        ]}
      >
        <PageDemo tabCounter={TAB_COUNTER.COUNT} actionsPlacement={ACTIONS_PLACEMENT.TOOLBAR} />
      </DemoSection>

      <AxisHeading
        letter="I"
        title="Иконки и цвета папок"
        description="Встроенные — иконка и цвет заданы в коде. Свои — из набора: 18 иконок Phosphor и 10 цветов Mantine без цветов приложения (terracotta — акцент, moss/gold/crimson — статусы, amber — рейтинг). Набор целиком — в модалке «Новая папка» (ось P)."
      />
      <DemoSection
        code="I1"
        title="Смысловые иконки встроенных"
        description="«Читаю» — открытая книга, «В планах» — часы, «Прочитано» — галочка, «Брошено» — архив. Цвета: синий, фиолетовый, бирюзовый, серый."
        pros={[
          'Папку узнаёшь по иконке без цвета — и в монохромной точке, и для дальтоников',
          'Свои папки встают в тот же ряд на равных',
        ]}
        cons={[
          'Своя папка может взять иконку встроенной — две «галочки» в полосе',
          'Нет общего знака «это закладка»',
        ]}
      >
        <Stack gap="md">
          <FolderList style={BUILT_IN_STYLE.SEMANTIC} />
          <PageDemo
            tabCounter={TAB_COUNTER.COUNT}
            actionsPlacement={ACTIONS_PLACEMENT.TABS}
            builtInStyle={BUILT_IN_STYLE.SEMANTIC}
          />
        </Stack>
      </DemoSection>
      <DemoSection
        code="I2"
        title="Закладка разного цвета, как на MangaLib"
        description="У всех встроенных одна иконка — залитая закладка, различаются только цветом."
        pros={['Сразу понятно, что это закладки', 'Набор иконок целиком остаётся своим папкам']}
        cons={[
          'Различаются только цветом — серое «Брошено» и синее «Читаю» путаются на мелком размере',
          'Своя папка с иконкой закладки неотличима от встроенной',
        ]}
      >
        <Stack gap="md">
          <FolderList style={BUILT_IN_STYLE.BOOKMARK} />
          <PageDemo
            tabCounter={TAB_COUNTER.COUNT}
            actionsPlacement={ACTIONS_PLACEMENT.TABS}
            builtInStyle={BUILT_IN_STYLE.BOOKMARK}
          />
        </Stack>
      </DemoSection>

      <AxisHeading
        letter="E"
        title="Загрузка и пустые состояния"
        description="Одна версия, не ось: скелетон повторяет вкладки, строку поиска и сетку; ошибка списка — глобальный тост и пустое состояние на месте списка."
      />
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
        <Stack gap={6}>
          <Text fz={12} c="dimmed">
            Загрузка
          </Text>
          <Paper withBorder radius="md" p="md">
            <BookmarksSkeleton cols={4} />
          </Paper>
        </Stack>
        <Stack gap={6}>
          <Text fz={12} c="dimmed">
            Загрузка, телефон
          </Text>
          <PhoneFrame>
            <BookmarksSkeleton cols={2} />
          </PhoneFrame>
        </Stack>
        <Stack gap={6}>
          <Text fz={12} c="dimmed">
            Ни одной закладки
          </Text>
          <Paper withBorder radius="md" p="md">
            <BookmarksEmpty />
          </Paper>
        </Stack>
        <Stack gap={6}>
          <Text fz={12} c="dimmed">
            Пустая папка
          </Text>
          <Paper withBorder radius="md" p="md">
            <FolderEmpty />
          </Paper>
        </Stack>
        <Stack gap={6}>
          <Text fz={12} c="dimmed">
            Поиск ничего не нашёл
          </Text>
          <Paper withBorder radius="md" p="md">
            <SearchEmpty />
          </Paper>
        </Stack>
      </SimpleGrid>
    </Stack>
  );
}

export default PageSection;
