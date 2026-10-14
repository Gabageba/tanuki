import { useState } from 'react';
import { SegmentedControl, Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import Frames from '../../Notifications/components/Frames';
import DemoSection from '../../components/DemoSection';
import SandboxOnly from '../../components/SandboxOnly';
import DownloadsPageMock from '../components/DownloadsPageMock';
import QueueBlock from '../components/QueueBlock';
import { QUEUE_REORDER, QUEUE_STATE, type QueueState } from '../models';

const STATE_OPTIONS = [
  { value: QUEUE_STATE.RUNNING, label: 'Качается' },
  { value: QUEUE_STATE.PAUSED, label: 'На паузе' },
  { value: QUEUE_STATE.QUOTA, label: 'Кончилось место' },
];

/** Q — очередь на странице «Загрузки» и перестановка в ней. */
function QueueSection() {
  const [queueState, setQueueState] = useState<QueueState>(QUEUE_STATE.RUNNING);

  return (
    <Stack gap="xl">
      <AxisHeading
        letter="Q"
        title="Очередь"
        description="Верх страницы «Загрузки»: текущая глава со страницами и полосой, три ожидающие (одна с длинным названием), одна с ошибкой источника. «Приостановить загрузки» ставит на паузу всю очередь. Переключатель ниже меняет состояние у обоих вариантов сразу; «Кончилось место» — очередь встала сама, объяснение над списком."
      />
      <SandboxOnly>
        <SegmentedControl
          data={STATE_OPTIONS}
          value={queueState}
          onChange={(value) => setQueueState(value as QueueState)}
        />
      </SandboxOnly>
      <DemoSection
        code="Q1"
        title="«Поднять наверх» в меню"
        description="У каждой строки «⋯»: «Поднять наверх» ставит главу сразу за текущей, «Отменить загрузку главы» убирает её. Ошибку повторяет отдельная кнопка рядом."
        pros={[
          'Работает пальцем в длинном списке — ничего не надо тянуть',
          'Строка чище: одна кнопка вместо ручки и крестика',
        ]}
        cons={['Только наверх — поставить главу третьей нельзя', 'Отмена спрятана в меню']}
      >
        <Frames>
          <DownloadsPageMock>
            <QueueBlock key={queueState} reorder={QUEUE_REORDER.MENU} queueState={queueState} />
          </DownloadsPageMock>
        </Frames>
      </DemoSection>
      <DemoSection
        code="Q2"
        title="Ручка перетаскивания"
        description="Слева у ожидающих глав ручка — любой порядок, как в Mihon; у текущей она неактивна. Справа крестик отмены."
        pros={['Любой порядок за одно движение', 'Отмена — в один клик']}
        cons={[
          'На телефоне ручку легко спутать с прокруткой, а тянуть через длинный список долго',
          'Нужна и клавиатурная перестановка — сложнее в реализации',
        ]}
      >
        <Frames>
          <DownloadsPageMock>
            <QueueBlock key={queueState} reorder={QUEUE_REORDER.DRAG} queueState={queueState} />
          </DownloadsPageMock>
        </Frames>
      </DemoSection>
    </Stack>
  );
}

export default QueueSection;
