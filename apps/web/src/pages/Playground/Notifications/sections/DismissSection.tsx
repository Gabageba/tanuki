import { Stack } from '@mantine/core';
import AxisHeading from '../components/AxisHeading';
import FeedPageMock from '../components/FeedPageMock';
import Frames from '../components/Frames';
import DemoSection from '../../components/DemoSection';
import { MOCK_FEED } from '../mocks';
import { DISMISS, LEADING, ROWS, type Dismiss } from '../models';

type Variant = {
  dismiss: Dismiss;
  code: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
};

const VARIANTS: Variant[] = [
  {
    dismiss: DISMISS.CURRENT,
    code: 'X0',
    title: 'Как сейчас',
    description: 'На строке «×», у кнопки «Отметить все уведомления прочитанными» двойная галочка.',
    pros: ['Крестик привычен как «убрать»'],
    cons: ['Одно и то же действие нарисовано двумя значками'],
  },
  {
    dismiss: DISMISS.CHECK,
    code: 'X1',
    title: 'Везде галочка',
    description:
      'На строке одна галочка, у кнопки двойная; подсказка строки — «Отметить прочитанным».',
    pros: [
      'Совпадает со словом «прочитано» в плане',
      'Строка и кнопка читаются как пара «одно / все»',
    ],
    cons: ['Галочка на строке может читаться как «принять»'],
  },
  {
    dismiss: DISMISS.CROSS,
    code: 'X2',
    title: 'Везде крестик',
    description: 'На строке «×», кнопка — «Убрать все уведомления» со «×».',
    pros: ['Привычный жест «смахнуть»'],
    cons: [
      'Звучит как удаление, хотя это «прочитано»',
      'Крестик у кнопки на всю ленту выглядит опаснее, чем есть',
    ],
  },
  {
    dismiss: DISMISS.TRASH,
    code: 'X3',
    title: 'Везде корзина',
    description: 'На строке корзина, кнопка — «Убрать все уведомления» с корзиной.',
    pros: ['Значок однозначно «убрать», не путается с «закрыть» и «принять»'],
    cons: [
      'Корзина обещает удаление и безвозвратность, хотя «прочитано» и есть удаление записи, но без «Отменить»',
    ],
  },
];

/** Ось X: значки «убрать одно» и «убрать все». */
function DismissSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="X"
        title="Значки «прочитано»"
        description="Клик по строке открывает цель, значок справа убирает строку без перехода, кнопка над списком убирает всё. Сейчас значки разные при одном смысле."
      />
      {VARIANTS.map(({ dismiss, ...rest }) => (
        <DemoSection key={rest.code} {...rest}>
          <Frames>
            <FeedPageMock
              items={MOCK_FEED.slice(0, 4)}
              rows={ROWS.CARDS}
              leading={LEADING.COVER_AND_ICON}
              dismiss={dismiss}
            />
          </Frames>
        </DemoSection>
      ))}
    </Stack>
  );
}

export default DismissSection;
