import { Group, Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import CaptionedFrame from '../../LibraryBackup/components/CaptionedFrame';
import DemoSection from '../../components/DemoSection';
import EmptyBookmarksMock from '../components/EmptyBookmarksMock';
import { EMPTY_ACTIONS, type EmptyActions } from '../models';

type Variant = {
  code: string;
  actions: EmptyActions;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
};

const VARIANTS: Variant[] = [
  {
    code: 'E0',
    actions: EMPTY_ACTIONS.CATALOG_ONLY,
    title: 'Как сейчас',
    description: 'Одна кнопка «Открыть каталог».',
    pros: ['Один путь — не надо выбирать'],
    cons: ['Кто пришёл с библиотекой на MangaLib, не узнает, что её можно перенести'],
  },
  {
    code: 'E1',
    actions: EMPTY_ACTIONS.CATALOG_MAIN,
    title: 'Главная — каталог',
    description: '«Открыть каталог» залитая, «Импорт из источника» — серая рядом.',
    pros: ['Новичок без библиотеки идёт привычным путём', 'Импорт рядом и заметен'],
    cons: ['Тому, у кого библиотека на сайте, главный путь — не его'],
  },
  {
    code: 'E2',
    actions: EMPTY_ACTIONS.IMPORT_MAIN,
    title: 'Главная — импорт',
    description: '«Импорт из источника» залитая и первой, каталог — серый.',
    pros: ['Перенос сотни тайтлов — самое ценное, что можно сделать на пустом экране'],
    cons: ['Без аккаунта на источнике импорт ведёт в «Войти» — для новичка тупик'],
  },
  {
    code: 'E3',
    actions: EMPTY_ACTIONS.BOTH_DEFAULT,
    title: 'Обе серые',
    description: 'Как сейчас по весу: две равные серые кнопки, решает человек.',
    pros: ['Ничего не навязывает', 'Вес как у остальных пустых состояний приложения'],
    cons: ['Нет подсказки, с чего начать'],
  },
  {
    code: 'E4',
    actions: EMPTY_ACTIONS.IMPORT_LINK,
    title: 'Каталог кнопкой, импорт — ссылкой',
    description:
      'Под кнопкой каталога — строка «Уже читаете на другом сайте? Импортируйте закладки».',
    pros: ['Фраза объясняет, кому нужен импорт', 'Кнопка одна — экран спокойный'],
    cons: [
      'Ссылка тише кнопки — её легко не заметить',
      'Ссылка-действие без иконки выбивается из правила кнопок',
    ],
  },
];

/** E — кнопки в пустых закладках. */
function EmptyBookmarksSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="E"
        title="Пустые закладки"
        description="Ни одной закладки ни в одной папке (BookmarksEmpty): вторая кнопка ведёт в ту же модалку с шага «Источник». На телефоне кнопки — столбиком."
      />
      {VARIANTS.map((variant) => (
        <DemoSection
          key={variant.code}
          code={variant.code}
          title={variant.title}
          description={variant.description}
          pros={variant.pros}
          cons={variant.cons}
        >
          <Group align="flex-start" gap="lg">
            <CaptionedFrame caption="Десктоп">
              <EmptyBookmarksMock actions={variant.actions} />
            </CaptionedFrame>
            <CaptionedFrame caption="Телефон · 375 px">
              <EmptyBookmarksMock actions={variant.actions} isPhone />
            </CaptionedFrame>
          </Group>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default EmptyBookmarksSection;
