import { Stack } from '@mantine/core';
import { CheckIcon, DeviceMobileIcon } from '@phosphor-icons/react';
import { Button } from '@mantine/core';
import { ClockIcon } from '@phosphor-icons/react';
import Frames from '../../Notifications/components/Frames';
import DownloadsPageMock from '../components/DownloadsPageMock';
import IosHintAlert from '../components/IosHintAlert';
import IosHintCard from '../components/IosHintCard';
import IosHintRow from '../components/IosHintRow';
import AxisHeading from '../../Notifications/components/AxisHeading';
import PhoneFrame from '../../Notifications/components/PhoneFrame';
import DemoSection from '../../components/DemoSection';
import IosSheetMock from '../components/IosSheetMock';
import IosStepsModal from '../components/IosStepsModal';
import OfferActions from '../components/OfferActions';
import OfferAlert from '../components/OfferAlert';
import OfferToast from '../components/OfferToast';
import { IOS_HINT_LOOK } from '../models';

const TITLE = 'Установите Tanuki на экран Домой';
const DETAIL =
  'Без установки Safari удаляет скачанное, если не открывать сайт 7 дней. «Поделиться» → «На экран Домой».';

/** H — подсказка для iOS Safari без установки при первом скачивании. */
function IosHintSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="H"
        title="Подсказка iOS"
        description="iOS Safari не умеет предлагать установку сам. При первом скачивании показываем, как добавить приложение на экран Домой и почему это важно для скачанного. Все варианты — в рамке телефона."
      />
      <DemoSection
        code="H1"
        title="Тост"
        description="Тот же тост, что у установки в Chromium, с шагами в описании."
        pros={['Один вид с I1', 'Не прерывает скачивание']}
        cons={[
          'Для шагов мало места — описание в три строки',
          'Исчезнет, пока ищешь кнопку «Поделиться»',
        ]}
      >
        <PhoneFrame>
          <OfferToast
            icon={<DeviceMobileIcon size={18} />}
            color="gray"
            title={TITLE}
            detail={DETAIL}
            actions={<OfferActions label="Понятно" icon={<CheckIcon />} />}
          />
        </PhoneFrame>
      </DemoSection>
      <DemoSection
        code="H2"
        title="Блок вверху «Загрузок»"
        description="Блок в виде M3 там, где лежит скачанное; висит, пока не нажато «Не сейчас»."
        pros={['Не мешает', 'Стоит рядом с тем, что может пропасть']}
        cons={['Видят только тогда, когда зайдут в «Загрузки» — уже после скачивания']}
      >
        <PhoneFrame>
          <OfferAlert
            icon={<DeviceMobileIcon />}
            title={TITLE}
            description={DETAIL}
            actions={<OfferActions label="Понятно" icon={<CheckIcon />} isFull />}
          />
        </PhoneFrame>
      </DemoSection>
      <DemoSection
        code="H3"
        title="Модалка с шагами"
        description="Нейтральная модалка: зачем, и три пронумерованных шага со значками кнопок Safari."
        pros={['Шаги видны крупно и по порядку']}
        cons={[
          'Прерывает первое же скачивание',
          'Значки в теле нарушают правило модалок — без них шаг не найти',
        ]}
      >
        <PhoneFrame>
          <IosStepsModal />
        </PhoneFrame>
      </DemoSection>
      <DemoSection
        code="H4"
        title="Нижний лист со стрелкой"
        description="Лист над панелью Safari, стрелка указывает на «Поделиться»."
        pros={['Показывает, куда нажать, а не описывает', 'Ощущается как часть системы']}
        cons={[
          'Кнопка «Поделиться» стоит по-разному на iPhone, iPad и в компактной панели Safari — стрелка будет промахиваться',
        ]}
      >
        <PhoneFrame>
          <IosSheetMock />
        </PhoneFrame>
      </DemoSection>
      <DemoSection
        code="H5"
        title="Блок H2, собранный как M3"
        description="Тот же блок вверху «Загрузок», но серый, а не акцентный, и «Не сейчас» — компактная кнопка по ширине текста, а не полоса во всю ширину."
        pros={['Ровно принятый вид предложения push', 'Серый не читается как предупреждение']}
        cons={['Всё ещё три строки высоты над вкладками']}
      >
        <Frames>
          <DownloadsPageMock>
            <OfferAlert
              color="gray"
              icon={<DeviceMobileIcon />}
              title={TITLE}
              description={DETAIL}
              actions={
                <Button size="xs" variant="default" leftSection={<ClockIcon />} w="fit-content">
                  Не сейчас
                </Button>
              }
            />
          </DownloadsPageMock>
        </Frames>
      </DemoSection>
      <DemoSection
        code="H6"
        title="Карточка как строка уведомления"
        description="Рамка без тонировки, иконка в сером квадрате 32 px, как у уведомлений; «Не сейчас» в правом верхнем углу."
        pros={['Спокойно, не похоже на ошибку', 'Тот же язык, что строки ленты уведомлений']}
        cons={['Может потеряться среди других блоков страницы']}
      >
        <Frames>
          <DownloadsPageMock>
            <IosHintCard />
          </DownloadsPageMock>
        </Frames>
      </DemoSection>
      <DemoSection
        code="H7"
        title="Карточка с шагами-чипами"
        description="Как H6, но шаги — два чипа со значками кнопок Safari, а про 7 дней — строкой ниже."
        pros={['Кнопки узнаются по значкам, как в самом Safari', 'Шаги читаются быстрее фразы']}
        cons={[
          'Значки повторяют интерфейс Safari и устареют вместе с ним',
          'Чипы похожи на кнопки, но не нажимаются',
        ]}
      >
        <Frames>
          <DownloadsPageMock>
            <IosHintCard withChips />
          </DownloadsPageMock>
        </Frames>
      </DemoSection>
      <DemoSection
        code="H8"
        title="Одна строка с раскрытием"
        description="Короткая строка «Установите Tanuki, чтобы скачанное не пропало»; «Как?» раскрывает шаги и причину."
        pros={['Около 40 px высоты вместо 120', 'Шаги — по запросу']}
        cons={['Про 7 дней без клика не узнать', 'На телефоне две кнопки теснят текст']}
      >
        <Frames>
          <DownloadsPageMock>
            <IosHintRow />
          </DownloadsPageMock>
        </Frames>
      </DemoSection>
      <DemoSection
        code="H9"
        title="H5 в цвете акцента"
        description="Тот же блок с компактным «Не сейчас», но фон, рамка и значок — акцентом, а не серым."
        pros={['Заметен сразу, первым на странице', 'Акцент — цвет приложения, а не тревоги']}
        cons={['Акцентный H2 уже читался предупреждением — здесь меньше только кнопка']}
      >
        <Frames>
          <DownloadsPageMock>
            <IosHintAlert look={IOS_HINT_LOOK.ACCENT} />
          </DownloadsPageMock>
        </Frames>
      </DemoSection>
      <DemoSection
        code="H10"
        title="H5 с акцентным значком"
        description="Блок остаётся серым, акцентный только значок телефона — в залитом квадрате 32 px, как у строк уведомлений; заголовок жирнее."
        pros={['Блок спокойный, а глаз цепляется за значок', 'Не похоже на предупреждение']}
        cons={[
          'Выделение точечное — на телефоне может не хватить',
          'Блок выше H5 на пару пикселей',
        ]}
      >
        <Frames>
          <DownloadsPageMock>
            <IosHintAlert look={IOS_HINT_LOOK.ICON} />
          </DownloadsPageMock>
        </Frames>
      </DemoSection>
      <DemoSection
        code="H11"
        title="H5 с акцентной полосой слева"
        description="Серый блок H5 с полосой 3 px акцентом по левому краю — как выделенная заметка."
        pros={['Читается как важная заметка, но не как ошибка', 'Высота та же, что у H5']}
        cons={['Полоса у края похожа на цитату, а не на предложение']}
      >
        <Frames>
          <DownloadsPageMock>
            <IosHintAlert look={IOS_HINT_LOOK.STRIPE} />
          </DownloadsPageMock>
        </Frames>
      </DemoSection>
      <DemoSection
        code="H12"
        title="H5 в золоте"
        description="Блок золотой, как полоса «Нет сети»: речь о том, что скачанное может пропасть."
        pros={['Тон совпадает с риском потерять скачанное']}
        cons={[
          'Без сети над ним встанет золотая полоса — два золотых блока подряд',
          'Читается предупреждением, хотя это совет',
        ]}
      >
        <Frames>
          <DownloadsPageMock>
            <IosHintAlert look={IOS_HINT_LOOK.GOLD} />
          </DownloadsPageMock>
        </Frames>
      </DemoSection>
    </Stack>
  );
}

export default IosHintSection;
