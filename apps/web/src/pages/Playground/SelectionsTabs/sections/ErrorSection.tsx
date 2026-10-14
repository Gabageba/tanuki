import { Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import SelectionsMock from '../components/SelectionsMock';
import { BASE_LOOK, FEED_STATE, NEXT_PAGE_ERROR, type NextPageError } from '../models';

type Variant = {
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  nextPageError: NextPageError;
};

const VARIANTS: Variant[] = [
  {
    code: 'F0',
    title: 'Как в каталоге',
    description:
      'Внизу ничего: ошибку показывает тост глобального обработчика запросов, подгрузка просто встаёт.',
    pros: ['Ничего нового — так же, как каталог'],
    cons: [
      'Тост пропал — и непонятно, почему лента кончилась',
      'Повторить нечем: триггер уже на экране и второй раз не сработает',
    ],
    nextPageError: NEXT_PAGE_ERROR.TOAST_ONLY,
  },
  {
    code: 'F1',
    title: 'Строка с причиной и «Повторить»',
    description:
      'На месте подгрузки — «Следующие тайтлы не загрузились» и кнопка «Повторить загрузку тайтлов».',
    pros: [
      'Видно, что случилось, и чинится на месте',
      'Тот же тон, что «Повторить запрос подборок»',
    ],
    cons: ['Ещё одна строка-состояние в приложении'],
    nextPageError: NEXT_PAGE_ERROR.RETRY_ROW,
  },
  {
    code: 'F2',
    title: 'Кнопка «Загрузить ещё»',
    description:
      'После ошибки подгрузка по прокрутке сменяется кнопкой «Загрузить ещё тайтлы»; причину называет тост.',
    pros: ['Минимум текста', 'Кнопка понятна и без тоста'],
    cons: ['Ошибка внизу не названа — выглядит как обычная ручная подгрузка'],
    nextPageError: NEXT_PAGE_ERROR.LOAD_MORE,
  },
];

/** Ось F — следующая порция не пришла; «Горячие новинки» Реманги, после первой порции. */
function ErrorSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="F"
        title="Ошибка подгрузки"
        description="Первая порция есть, следующая упала. Ошибку запроса в любом случае показывает тост глобального обработчика — вопрос в том, что остаётся внизу сетки. Окно прокручено к концу."
      />
      {VARIANTS.map(({ code, title, description, pros, cons, nextPageError }) => (
        <DemoSection
          key={code}
          code={code}
          title={title}
          description={description}
          pros={pros}
          cons={cons}
        >
          <VariantFrames>
            <SelectionsMock
              look={{ ...BASE_LOOK, nextPageError }}
              state={FEED_STATE.NEXT_PAGE_ERROR}
            />
          </VariantFrames>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default ErrorSection;
