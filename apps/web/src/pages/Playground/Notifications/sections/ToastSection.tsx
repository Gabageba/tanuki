import { Button, Group, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { BellIcon } from '@phosphor-icons/react';
import AxisHeading from '../components/AxisHeading';
import Frames from '../components/Frames';
import ToastCard from '../components/ToastCard';
import ToastCollapsed from '../components/ToastCollapsed';
import DemoSection from '../../components/DemoSection';
import SandboxOnly from '../../components/SandboxOnly';
import {
  getNotificationDetail,
  getNotificationTitle,
  getToneColor,
  getToneToastDuration,
  getTypeIcon,
  getTypeTone,
} from '../lib';
import { MOCK_TOAST_ITEMS } from '../mocks';
import { TOAST_ACTION, TOAST_TONE, type ToastAction, type ToastTone } from '../models';

type ListProps = {
  action: ToastAction;
  tone: ToastTone;
  count?: number;
};

function ToastList({ action, tone, count = MOCK_TOAST_ITEMS.length }: ListProps) {
  return (
    <Group align="flex-start" gap="md">
      {MOCK_TOAST_ITEMS.slice(0, count).map((item) => (
        <ToastCard key={item.id} item={item} action={action} tone={tone} />
      ))}
    </Group>
  );
}

const showThreeRealToasts = () => {
  MOCK_TOAST_ITEMS.slice(0, 3).forEach((item) => {
    const tone = getTypeTone(item.type);
    notifications.show({
      title: getNotificationTitle(item),
      message: getNotificationDetail(item),
      color: getToneColor(tone),
      icon: getTypeIcon(item.type, 18),
      autoClose: getToneToastDuration(tone),
    });
  });
};

/** Оси T, D, Q: тост о важном событии. */
function ToastSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="T"
        title="Кликабельность тоста"
        description="Тост приходит по SSE для категорий «Аккаунт», «Источники», «Администрирование»; для новых глав — нет. Тон здесь по категории (D1)."
      />
      <DemoSection
        code="T1"
        title="Весь тост кликабелен"
        description="Клик по тосту ведёт к цели и прочитывает запись. Подсветка при наведении, «×» закрывает."
        pros={['Большая цель нажатия, особенно на телефоне']}
        cons={['Случайные клики, ссылка не видна']}
      >
        <ToastList action={TOAST_ACTION.WHOLE} tone={TOAST_TONE.BY_CATEGORY} count={2} />
      </DemoSection>
      <DemoSection
        code="T2"
        title="Отдельная ссылка «Открыть»"
        description="Остальной тост только сообщает."
        pros={['Явное действие, меньше случайных переходов']}
        cons={['Мелкая цель на телефоне']}
      >
        <ToastList action={TOAST_ACTION.LINK} tone={TOAST_TONE.BY_CATEGORY} count={2} />
      </DemoSection>
      <DemoSection
        code="T3"
        title="Только сообщение"
        description="Тост ничего не открывает, к цели — через ленту."
        pros={['Один путь к цели, проще']}
        cons={['Лишний шаг до цели']}
      >
        <ToastList action={TOAST_ACTION.NONE} tone={TOAST_TONE.BY_CATEGORY} count={2} />
      </DemoSection>
      <AxisHeading
        letter="D"
        title="Тон и длительность"
        description="Четыре события: вход с нового устройства, источник лёг, парсер упал, источник ожил. На T2."
      />
      <DemoSection
        code="D1"
        title="Тон по категории, длительность по важности"
        description="Безопасность — красный, 10 с; источник или парсер лёг — золотой, 8 с; ожил — зелёный, 5 с; события инвайтов — нейтральный, 5 с."
        pros={['Срочное заметнее и держится дольше']}
        cons={['Четыре тона придётся запомнить']}
      >
        <ToastList action={TOAST_ACTION.LINK} tone={TOAST_TONE.BY_CATEGORY} />
      </DemoSection>
      <DemoSection
        code="D2"
        title="Единый нейтральный тон"
        description="Иконка категории без цветовой разницы, у всех 6 с."
        pros={['Проще, меньше цветов на экране']}
        cons={['Безопасность не выделяется среди остального']}
      >
        <ToastList action={TOAST_ACTION.LINK} tone={TOAST_TONE.NEUTRAL} />
      </DemoSection>
      <AxisHeading
        letter="Q"
        title="Несколько тостов подряд"
        description="Три события за пару секунд: вход с нового устройства, источник лёг, парсер упал."
      />
      <DemoSection
        code="Q1"
        title="Стопка"
        description="Все три видны, старые ниже. Кнопка справа показывает настоящие тосты Mantine в стопке."
        pros={['Ничего не теряется']}
        cons={['Занимает экран, особенно на телефоне']}
      >
        <Stack gap="md">
          <Frames>
            <Stack gap="xs" align="flex-end">
              <ToastList action={TOAST_ACTION.LINK} tone={TOAST_TONE.BY_CATEGORY} count={3} />
            </Stack>
          </Frames>
          <SandboxOnly>
            <Button leftSection={<BellIcon />} onClick={showThreeRealToasts}>
              Показать три настоящих тоста
            </Button>
          </SandboxOnly>
        </Stack>
      </DemoSection>
      <DemoSection
        code="Q2"
        title="Новый заменяет предыдущий"
        description="На экране всегда один тост — последнее событие."
        pros={['Один тост, экран свободен']}
        cons={['Первое событие, возможно важное, исчезает раньше времени']}
      >
        <Frames>
          {MOCK_TOAST_ITEMS.slice(2, 3).map((item) => (
            <ToastCard
              key={item.id}
              item={item}
              action={TOAST_ACTION.LINK}
              tone={TOAST_TONE.BY_CATEGORY}
            />
          ))}
        </Frames>
      </DemoSection>
      <DemoSection
        code="Q3"
        title="Свёртка"
        description="Один тост «Вход с нового устройства и ещё 2 события» ведёт в ленту."
        pros={['Не заваливает экран']}
        cons={['Теряется конкретика каждого события']}
      >
        <Frames>
          <ToastCollapsed />
        </Frames>
      </DemoSection>
    </Stack>
  );
}

export default ToastSection;
