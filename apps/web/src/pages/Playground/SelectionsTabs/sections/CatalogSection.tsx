import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import SelectionsMock from '../components/SelectionsMock';
import { CATALOG_LINK, DRAFT_LOOK, type CatalogLink } from '../models';

type Variant = {
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  catalog: CatalogLink;
};

const VARIANTS: Variant[] = [
  {
    code: 'C0',
    title: 'Как сейчас — ArrowLink справа',
    description:
      '«Каталог: Реманга» с жирной стрелкой справа в строке источника. Цвет уже серый, акцент — при наведении.',
    pros: ['Подписано полностью, ни с чем не спутать'],
    cons: [
      'Жирная стрелка и длинная подпись тянут взгляд от заголовка источника',
      'Название источника повторено рядом с самим заголовком',
    ],
    catalog: CATALOG_LINK.ARROW,
  },
  {
    code: 'C1',
    title: 'Тихая ссылка «Каталог»',
    description:
      'Там же, но одно слово мелким серым текстом без стрелки — источник и так назван слева.',
    pros: ['Место прежнее, вес меньше всех из видимых вариантов'],
    cons: ['На телефоне без наведения выглядит как подпись, а не ссылка'],
    catalog: CATALOG_LINK.QUIET,
  },
  {
    code: 'C2',
    title: 'Иконка рядом с видом',
    description:
      'Кнопка-иконка с книгами в одном ряду с переключателем сетка/список, подпись — в подсказке.',
    pros: ['Строка справа становится чисто служебной', 'Одинаковая высота с переключателем вида'],
    cons: ['Иконка без подписи — смысл узнаётся только по подсказке, на телефоне её нет'],
    catalog: CATALOG_LINK.ICON,
  },
  {
    code: 'C3',
    title: 'Во второй строке заголовка',
    description:
      'Под названием источника: «remanga.org · Каталог». Кнопкой-переключателем остаётся только строка названия, ссылка — рядом с доменом.',
    pros: ['Ссылка привязана к своему источнику', 'Справа остаётся только вид'],
    cons: [
      'Мелко',
      'Кнопка смены источника сжимается до строки названия — логотип и домен больше не нажимаются',
    ],
    catalog: CATALOG_LINK.SUBTITLE,
  },
  {
    code: 'C4',
    title: 'Пункт в меню источника',
    description:
      'В списке, который открывает заголовок, под источниками — разделитель и «Каталог: Реманга» с книгами.',
    pros: ['Самая чистая шапка'],
    cons: [
      'Спрятано: кто не открывал меню, о каталоге не узнает',
      'В меню выбора источника — пункт, который ничего не выбирает',
    ],
    catalog: CATALOG_LINK.MENU,
  },
];

/** Ось C — как выглядит переход в каталог; показано на итоге. */
function CatalogSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="C"
        title="Переход в каталог"
        description="Ссылка в каталог источника — второстепенный выход со страницы, а в C0 она спорит с заголовком источника. Показано на итоге; внизу конечного блока («В тренде» Реманги) в каждом варианте остаётся тот же тихий «Каталог: Реманга» из E2."
      />
      {VARIANTS.map(({ code, title, description, pros, cons, catalog }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <VariantFrames>
            <SelectionsMock look={{ ...DRAFT_LOOK, catalog }} />
          </VariantFrames>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default CatalogSection;
