import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import HomeSourceSection from '../components/HomeSourceSection';
import { HOME_DESU } from '../mocks';
import { CATALOG_LINK, type CatalogLink } from '../models';

const VARIANTS: {
  code: string;
  link: CatalogLink;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
}[] = [
  {
    code: 'L1',
    link: CATALOG_LINK.RIGHT,
    title: '«Каталог →» справа',
    description:
      'Как «Все результаты →» в поиске: ссылка справа в строке заголовка, название источника — просто текст.',
    pros: ['повторяет поиск', 'ссылка подписана — понятно, куда ведёт'],
    cons: ['на телефоне отнимает ширину у длинного названия источника'],
  },
  {
    code: 'L2',
    link: CATALOG_LINK.TITLE,
    title: 'Название — ссылка',
    description:
      'Логотип и название источника со стрелкой «›» — сама ссылка в каталог. Справа пусто.',
    pros: ['меньше элементов в строке', 'название не обрезается на телефоне'],
    cons: [
      'в поиске отвергнуто (S5): заголовок как ссылку угадывают не все',
      'стрелка «›» на главной и каретка сворачивания в поиске похожи, а делают разное',
    ],
  },
  {
    code: 'L3',
    link: CATALOG_LINK.BOTH,
    title: 'И то и другое',
    description:
      'Название ведёт в каталог, и справа ещё «Каталог →». Так написано в плане: «название секции и „Каталог →“ — в каталог».',
    pros: ['кто нажмёт на название, тоже попадёт в каталог'],
    cons: [
      'два пути в одно место в одной строке',
      'расходится с поиском, где название сворачивает секцию',
    ],
  },
];

/** Ось L — ссылка из секции в каталог источника. */
function LinkSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="L"
        title="Ссылка в каталог"
        description="У блоков ссылок нет — их списки свои у сайта. Есть одна ссылка у источника, в /catalog/:sourceId. Секция Desu, вид S1."
      />
      {VARIANTS.map(({ code, link, title, description, pros, cons }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <VariantFrames>
            <HomeSourceSection home={HOME_DESU} link={link} />
          </VariantFrames>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default LinkSection;
