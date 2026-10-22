import { Group, Stack } from '@mantine/core';
import { UploadSimpleIcon } from '@phosphor-icons/react';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import AxisHeading from '../../Notifications/components/AxisHeading';
import DemoSection from '../../components/DemoSection';
import ModalFrame from '../../components/ModalFrame';
import BackupFileForm from '../components/BackupFileForm';
import CaptionedFrame from '../components/CaptionedFrame';
import CurrentImportForm from '../components/CurrentImportForm';
import { getFileStateLabel } from '../lib';
import { FILE_STATE, FILE_VIEW } from '../models';

const STATES = [FILE_STATE.EMPTY, FILE_STATE.SENDING, FILE_STATE.ERROR];

type VariantProps = {
  view: typeof FILE_VIEW.INPUT | typeof FILE_VIEW.DROPZONE;
};

function FileVariant({ view }: VariantProps) {
  return (
    <Group align="flex-start" gap="lg">
      {STATES.map((state) => (
        <CaptionedFrame key={state} caption={getFileStateLabel(state)}>
          <ModalFrame
            title="Восстановить из копии"
            tone={MODAL_TONE.NEUTRAL}
            icon={UploadSimpleIcon}
          >
            <BackupFileForm view={view} state={state} />
          </ModalFrame>
        </CaptionedFrame>
      ))}
      <CaptionedFrame caption="375 px">
        <ModalFrame
          title="Восстановить из копии"
          tone={MODAL_TONE.NEUTRAL}
          icon={UploadSimpleIcon}
          isPhone
        >
          <BackupFileForm view={view} state={FILE_STATE.EMPTY} />
        </ModalFrame>
      </CaptionedFrame>
    </Group>
  );
}

/** F — шаг «Файл». */
function FileSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="F"
        title="Шаг «Файл»"
        description="Клиент сам проверяет файл схемой из контрактов и пишет ошибку под полем: «Это не резервная копия tanuki», «Копия сделана более новой версией tanuki», «Файл больше 20 МБ». «Далее» — submit формы; пока сервер считает сводку, в кнопке Loader. Поля живые: выберите любой файл и нажмите «Далее» — без «tanuki-backup» в имени он считается чужим."
      />
      <DemoSection
        code="F0"
        title="Как сейчас"
        description="Голый FileInput, после выбора — мок того, что «нашлось», и «Импорт»."
        cons={[
          'Не сказано, какой файл нужен и откуда его взять',
          'Файл не проверяется — любая ошибка всплыла бы только после «Импорт»',
        ]}
      >
        <Group align="flex-start" gap="lg">
          <CaptionedFrame caption="Файл не выбран">
            <ModalFrame title="Импорт закладок" tone={MODAL_TONE.NEUTRAL} icon={UploadSimpleIcon}>
              <CurrentImportForm file={null} />
            </ModalFrame>
          </CaptionedFrame>
        </Group>
      </DemoSection>
      <DemoSection
        code="F1"
        title="FileInput и пояснение"
        description="Главная фраза — что выбрать, пояснение — откуда этот файл и что до записи будет сводка. Поле без label: смысл в иконке и placeholder."
        pros={[
          'Никаких новых зависимостей — FileInput уже есть',
          'Ошибка под полем — как в любой форме приложения',
          'Самый низкий шаг, на телефоне кнопки сразу под полем',
        ]}
        cons={['На десктопе файл нельзя перетащить из папки загрузок']}
      >
        <FileVariant view={FILE_VIEW.INPUT} />
      </DemoSection>
      <DemoSection
        code="F2"
        title="Зона перетаскивания"
        description="Пунктирная зона с кнопкой выбора внутри; выбранный файл заменяет её строкой с именем, размером и крестиком."
        pros={[
          'Файл из загрузок перетаскивается одним движением',
          'Имя и размер выбранного файла видны крупно — легко заметить, что выбран не тот',
        ]}
        cons={[
          'Нужен @mantine/dropzone или свой drag-and-drop — в проекте ни того, ни другого',
          'На телефоне перетаскивать нечего, а зона в два раза выше поля',
          'Ошибка под зоной — своя разметка, а не error поля',
        ]}
      >
        <FileVariant view={FILE_VIEW.DROPZONE} />
      </DemoSection>
    </Stack>
  );
}

export default FileSection;
