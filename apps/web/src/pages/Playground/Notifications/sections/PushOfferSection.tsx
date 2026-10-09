import { useState } from 'react';
import { Button, SegmentedControl, Stack } from '@mantine/core';
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import AxisHeading from '../components/AxisHeading';
import FeedPageMock from '../components/FeedPageMock';
import Frames from '../components/Frames';
import PushBanner from '../components/PushBanner';
import PushFolderHint from '../components/PushFolderHint';
import PushToast from '../components/PushToast';
import TitlePageMock from '../components/TitlePageMock';
import DemoSection from '../../components/DemoSection';
import SandboxOnly from '../../components/SandboxOnly';
import { PUSH_OFFER_STATE, type PushOfferState } from '../models';

/** Ось K: предложение включить push после первого добавления в закладки. */
function PushOfferSection() {
  const [state, setState] = useState<PushOfferState>(PUSH_OFFER_STATE.ASK);
  const [resetKey, setResetKey] = useState(0);

  return (
    <Stack gap="xl" key={resetKey}>
      <AxisHeading
        letter="K"
        title="Предложение включить push"
        description="Появляется после первого добавления в папку со слежением, если push на устройстве ещё не включён. «Не сейчас» прячет предложение (в приложении это запоминается на устройстве); «Включить» открывает системный запрос браузера."
      />
      <SandboxOnly>
        <Stack gap="xs">
          <SegmentedControl
            value={state}
            onChange={(next) =>
              setState(
                next === PUSH_OFFER_STATE.DENIED ? PUSH_OFFER_STATE.DENIED : PUSH_OFFER_STATE.ASK,
              )
            }
            data={[
              { value: PUSH_OFFER_STATE.ASK, label: 'Предложение' },
              { value: PUSH_OFFER_STATE.DENIED, label: 'Браузер запретил' },
            ]}
          />
          <Button
            variant="default"
            leftSection={<ArrowCounterClockwiseIcon />}
            onClick={() => setResetKey((prev) => prev + 1)}
          >
            Вернуть предложения после «Не сейчас»
          </Button>
        </Stack>
      </SandboxOnly>
      <DemoSection
        code="K1"
        title="Баннер над контентом"
        description="Плашка вверху страницы тайтла."
        pros={['Заметно и не пропадает само']}
        cons={['Сдвигает контент, может мозолить глаза']}
      >
        <Frames>
          <TitlePageMock banner={<PushBanner state={state} />} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="K2"
        title="Тост с действием"
        description="Появляется сразу после добавления; здесь показан как есть, без автозакрытия."
        pros={['В момент действия, ничего не сдвигает']}
        cons={['Исчезает сам, можно не успеть решить']}
      >
        <Frames>
          <PushToast state={state} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="K3"
        title="Плашка в выборе папки"
        description="Строка под выбором папки в форме «В закладки»."
        pros={['Встроено в момент действия']}
        cons={['Предложение показывается до того, как тайтл добавлен']}
      >
        <Frames>
          <PushFolderHint state={state} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="K4"
        title="Карточка в ленте уведомлений"
        description="Первая строка ленты; в пустой ленте — над пустым состоянием."
        pros={['Не лезет в другие экраны']}
        cons={['Пользователь может не открыть ленту']}
      >
        <Stack gap="xl">
          <Frames>
            <FeedPageMock top={<PushBanner state={state} />} />
          </Frames>
          <Frames desktopOnly>
            <FeedPageMock items={[]} top={<PushBanner state={state} />} />
          </Frames>
        </Stack>
      </DemoSection>
    </Stack>
  );
}

export default PushOfferSection;
