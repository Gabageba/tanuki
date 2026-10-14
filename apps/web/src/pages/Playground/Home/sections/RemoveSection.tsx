import { Notification, Stack, Text } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import VariantFrames from '../../TitleSearch/components/VariantFrames';
import DemoSection from '../../components/DemoSection';
import ContinueReading from '../components/ContinueReading';
import RemovedFromContinueMessage from '../components/RemovedFromContinueMessage';
import { MOCK_CONTINUE } from '../mocks';
import { CONTINUE_CARD } from '../models';

/** Ось U — как убрать тайтл из «Продолжить чтение». */
function RemoveSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="U"
        title="Убрать из «Продолжить чтение»"
        description="Выбран один способ — меню «⋯», как у закладок (Q4). Показан на узкой и широкой карточке: у них разное место для «⋯». Нажмите «Убрать» — карточка пропадёт, тост внизу экрана вернёт её."
      />
      <DemoSection
        code="U1"
        title="Меню «⋯» на карточке"
        description="«⋯» в строке под названием (у широкой — справа сверху), в меню один пункт «Убрать из „Продолжить чтение“» красным. Без модалки: карточка пропадает сразу, тост «Тайтл убран…» с «Отменить» на 6 секунд."
        pros={[
          'тот же приём, что у закладок, — второй раз учиться не нужно',
          '«⋯» видно всегда, и на телефоне — не нужно наведение или долгое нажатие',
          'в меню есть место для будущих действий (открыть на другом источнике)',
        ]}
        cons={[
          'меню из одного пункта — лишний клик против крестика',
          'строка под названием теснее: время делит её с «⋯»',
        ]}
      >
        <VariantFrames
          desktopLabel="Десктоп · C1"
          phoneLabel="375 px · C1"
          extraPhones={[
            {
              label: '375 px · C2',
              content: <ContinueReading items={MOCK_CONTINUE} card={CONTINUE_CARD.WIDE} />,
            },
          ]}
        >
          <ContinueReading items={MOCK_CONTINUE} />
        </VariantFrames>
        <Stack gap={6} maw={420}>
          <Text fz={12} c="dimmed" ff="monospace">
            Тост
          </Text>
          <Notification withCloseButton={false}>
            <RemovedFromContinueMessage onRestore={() => undefined} />
          </Notification>
        </Stack>
      </DemoSection>
    </Stack>
  );
}

export default RemoveSection;
