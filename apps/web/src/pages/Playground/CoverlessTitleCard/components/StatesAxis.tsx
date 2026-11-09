import { Stack, Title } from '@mantine/core';
import DemoSection from '../../components/DemoSection';
import {
  CARD_DENSITY,
  FEED_STATE,
  PANEL_LAYOUT,
  type CardDensity,
  type FeedState,
} from '../models';
import { EXAMPLES } from '../mocks';
import PreviewFrame from './PreviewFrame';
import SelectionsPreview from './SelectionsPreview';

const STATES: {
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  state: FeedState;
  density?: CardDensity;
}[] = [
  {
    code: 'S1',
    title: 'Скелетон компактной карточки',
    description:
      'Анатомия C1: название, папка и нижняя строка; без прямоугольника обложки. Известная панель остаётся настоящей.',
    pros: ['Загрузка повторяет будущую раскладку'],
    cons: ['Высота зависит от длины ещё неизвестных названий'],
    state: FEED_STATE.LOADING,
    density: CARD_DENSITY.COMPACT,
  },
  {
    code: 'S2',
    title: 'Скелетон двух строк описания',
    description: 'Та же анатомия с двумя строками описания для C2.',
    pros: ['Резервирует место под краткое описание'],
    cons: ['При отсутствии описания карточка после загрузки станет ниже'],
    state: FEED_STATE.LOADING,
    density: CARD_DENSITY.SHORT,
  },
  {
    code: 'S3',
    title: 'Скелетон четырёх строк описания',
    description:
      'Четыре строки описания для подробной C3; это состояние загрузки, а не дополнительный режим карточки.',
    pros: ['Соответствует подробному виду'],
    cons: ['Короткие описания сократят высоту выдачи'],
    state: FEED_STATE.LOADING,
    density: CARD_DENSITY.DETAILED,
  },
  {
    code: 'S4',
    title: 'Пустой месяц',
    description:
      'Обычный EmptyState блока. Месяц и сортировку можно менять. При ошибке запроса здесь будет то же состояние, об ошибке сообщает глобальное уведомление.',
    pros: ['Панель остаётся доступной'],
    cons: ['Сам блок не отличает пустой ответ от ошибки'],
    state: FEED_STATE.EMPTY,
  },
  {
    code: 'S5',
    title: 'Источник не ответил',
    description:
      'Существующий SourceMissedState вместо вкладок. Кнопка повтора в макете возвращает готовую выдачу.',
    pros: ['Сохраняет знакомое действие повтора'],
    cons: ['Выбрать другой блок этого источника пока нельзя'],
    state: FEED_STATE.UNAVAILABLE,
  },
  {
    code: 'S6',
    title: 'Нужен вход в источник',
    description:
      'Существующее состояние с переходом к аккаунтам источников. Новых модалок и действий не появляется.',
    pros: ['Сразу предлагает нужный переход'],
    cons: ['Просмотр требует настройки аккаунта'],
    state: FEED_STATE.LOCKED,
  },
];

function StatesAxis() {
  return (
    <Stack gap="xl">
      <Title order={3} id="axis-S">
        S · Загрузка и другие состояния
      </Title>
      {STATES.map(({ state, density, ...variant }) => (
        <DemoSection key={variant.code} {...variant}>
          <PreviewFrame phone={false}>
            <SelectionsPreview
              phone={false}
              examples={EXAMPLES}
              state={state}
              density={density}
              layout={PANEL_LAYOUT.STACKED}
            />
          </PreviewFrame>
          <PreviewFrame phone>
            <SelectionsPreview
              phone
              examples={EXAMPLES}
              state={state}
              density={density}
              layout={PANEL_LAYOUT.STACKED}
            />
          </PreviewFrame>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default StatesAxis;
