import { Divider, Group, Stack, Text, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import SectionNav from '../components/SectionNav';
import DemoSection from '../components/DemoSection';
import AxisHeading from '../Notifications/components/AxisHeading';
import AppearancePreview from './components/AppearancePreview';
import CurrentToasts from './components/CurrentToasts';
import StackPreview from './components/StackPreview';
import AuthViewport from './components/AuthViewport';
import OverlayDemo from './components/OverlayDemo';
import QueueDemo from './components/QueueDemo';
import ResultSection from './components/ResultSection';
import { SECTION_GROUPS, VIEWPORT_CONTEXT } from './models';
import {
  ACCENT_VARIANTS,
  ACTION_VARIANTS,
  ALIGNMENT_VARIANTS,
  INTERACTION_VARIANTS,
  TEXT_VARIANTS,
} from './variants';

function PlaygroundGlobalToasts() {
  return (
    <Stack gap="xl" p="md">
      <Group gap="xs">
        <GoBackButton path={ROUTE_PATHS.PLAYGROUND} />
        <Title order={2}>Общие тосты проекта</Title>
      </Group>
      <Stack gap="xs" maw={760}>
        <Text fz="sm" c="dimmed">
          Зафиксирован A1 + T5 + D5a + S2 + I1 + C1: выбранный итог отмечен в разделе R. Варианты по
          утверждённому плану global-toasts сохранены для сравнения. В первичных сравнениях меняется
          одна ось; остальные используют A2 + T1 + D2 + I1. Доработки D3–D5, T3–T4 и C1–C2 показаны
          на прежней базе A1 + T2 + D2 + S2 + I1, сразу со всеми примерами. T5 задаёт единый вес
          заголовков 600; D5a/D5b сравнивают кнопки 30/26 px сразу с T5 + C1. D5c–D5e используют
          встроенные compact-xs/sm/md без ручной подгонки. Все новые комбинации собраны в конце
          «Итога», прежний итог сохранён. Макеты доступны в обеих темах — переключатель в шапке.
        </Text>
        <Text fz="sm" c="dimmed">
          Десктоп и телефон 375 px показаны отдельно. Русские и английские сообщения, пять тонов,
          отмена и PWA не обрезаются. Галереи не исчезают по таймеру; таймеры и очередь проверяются
          в Q. Всё без пометки «Только песочница» показано так, как пойдёт в реализацию. Действия
          демонстрационные, запросы не отправляются.
        </Text>
      </Stack>
      <Group align="stretch" wrap="nowrap" gap="xl">
        <SectionNav groups={SECTION_GROUPS} />
        <Divider orientation="vertical" visibleFrom="lg" />
        <Stack gap={64} flex={1} miw={0}>
          <AxisHeading
            letter="B"
            title="Как сейчас"
            description="Настоящий Notification из установленного Mantine и текущий UndoToastMessage. Хост имеет ширину 440 px и лимит 5; отдельный лимит событий — 3. Ниже карточки показаны одновременно для сравнения, без их нынешнего автозакрытия."
          />
          <DemoSection
            code="B0"
            title="Разные правила у разных производителей"
            description="Результат без иконки, ошибка с общим заголовком, предметная иконка у события, отдельные раскладки отмены и PWA."
            pros={['Существующие компоненты и знакомые сценарии']}
            cons={[
              'Цвет и плотность зависят от места вызова',
              'Отмена не защищена общим лимитом',
              'На телефоне нет общего отступа от нижней навигации',
            ]}
          >
            <CurrentToasts />
          </DemoSection>
          <AxisHeading
            letter="A"
            title="Небольшой цветовой акцент"
            description="Пять смысловых тонов на нейтральной карточке: успех, ошибка, предупреждение, акцент действия и нейтральное сообщение. Цвет не определяет приоритет."
          />
          {ACCENT_VARIANTS.map(({ appearance, width, samples, ...variant }) => (
            <DemoSection key={variant.code} {...variant}>
              <AppearancePreview appearance={appearance} width={width} samples={samples} />
            </DemoSection>
          ))}
          <AxisHeading
            letter="T"
            title="Текст и плотность"
            description="Короткий результат — одно сообщение. Заголовок и пояснение появляются только вместе с дополнительным смыслом; весь текст 14 px, без обязательной второй строки."
          />
          {TEXT_VARIANTS.map(({ appearance, width, samples, ...variant }) => (
            <DemoSection key={variant.code} {...variant}>
              <AppearancePreview appearance={appearance} width={width} samples={samples} />
            </DemoSection>
          ))}
          <AxisHeading
            letter="D"
            title="Кнопка действия"
            description="Одна оболочка для отмены и PWA. Кнопка называет объект и имеет иконку. Крестик никогда не выполняет возврат или обновление."
          />
          {ACTION_VARIANTS.map(({ appearance, width, samples, ...variant }) => (
            <DemoSection key={variant.code} {...variant}>
              <AppearancePreview appearance={appearance} width={width} samples={samples} />
            </DemoSection>
          ))}
          <AxisHeading
            letter="S"
            title="Размеры и стек из трёх"
            description="Старые карточки выше, новые появляются снизу. Закрытие освобождает место; четвёртый временный тост сначала скрывает постоянное предложение PWA. На телефоне нижняя навигация остаётся доступна."
          />
          <DemoSection
            code="S1"
            title="360 px, интервал 8 px"
            description="Узкая плотная стопка. На телефоне ширина определяется экраном и полями по 12 px."
            pros={['Перекрывает меньше контента по ширине']}
            cons={['Длинные тексты чаще переносятся и увеличивают высоту']}
          >
            <StackPreview width={360} gap={8} />
          </DemoSection>
          <DemoSection
            code="S2"
            title="420 px, интервал 12 px"
            description="Более широкая стопка с заметным разделением карточек. На телефоне ширина та же, что в S1; сохраняется отличие интервалов."
            pros={['На десктопе меньше переносов', 'Соседние карточки сильнее разделены']}
            cons={[
              'Занимает больше ширины',
              'На телефоне дополнительный интервал только увеличивает высоту',
            ]}
          >
            <StackPreview width={420} gap={12} />
          </DemoSection>
          <AxisHeading
            letter="O"
            title="Оверлеи, читалка и клавиатура"
            description="Проверка совместимости, без нового выбора логики. Тост виден сразу, не перехватывает фокус; форма и её главное действие остаются доступны. В читалке и на входе нет отступа под отсутствующую навигацию."
          />
          <DemoSection
            code="O1"
            title="Модалка и drawer"
            description="Откройте настоящий оверлей, перейдите Tab к крестику и вернитесь к форме. На телефоне проверьте поле с открытой клавиатурой. Тост находится выше слоя оверлея, но внутри его области клавиатурного фокуса."
            pros={[
              'Ошибка остаётся видимой при открытой форме',
              'Кнопка закрытия доступна с клавиатуры',
            ]}
            cons={['При малой высоте форма требует прокрутки']}
          >
            <OverlayDemo />
          </DemoSection>
          <DemoSection
            code="O2"
            title="Вход: обычная и сокращённая область"
            description="Слева — телефон без нижней панели. Рамка 375 × 360 показывает оставшееся место при клавиатуре; горизонтальная рамка — 667 × 320. Сама клавиатура не имитируется. Форму можно прокручивать."
            pros={[
              'Не резервирует пустой отступ под навигацию',
              'Крестик и поля остаются внутри доступной области',
            ]}
            cons={['На малой высоте все поля одновременно не помещаются']}
          >
            <Group align="flex-start" gap="lg">
              <AuthViewport height={620} label="Вход · 375 × 620" />
              <AuthViewport height={360} label="При клавиатуре · область 375 × 360" />
              <AuthViewport height={320} width={667} label="Горизонтально · область 667 × 320" />
            </Group>
          </DemoSection>
          <DemoSection
            code="O3"
            title="Читалка без нижней навигации"
            description="Результат действия и его ошибка остаются доступны. При скрытых панелях читалки стек отступает только от края экрана. Фоновые события проверяются отдельно в Q."
            pros={['Нет пустого отступа под панель приложения']}
            cons={['Три сообщения закрывают часть страницы комикса']}
          >
            <StackPreview width={360} gap={8} context={VIEWPORT_CONTEXT.READER} />
          </DemoSection>
          <AxisHeading
            letter="I"
            title="Наведение, фокус и закрытие"
            description="События ведут к своей цели всей карточкой. В галерее переход отмечается в обвязке, чтобы не покидать макет. Кнопки отмены, PWA и крестик работают независимо."
          />
          {INTERACTION_VARIANTS.map(({ appearance, width, samples, ...variant }) => (
            <DemoSection key={variant.code} {...variant}>
              <AppearancePreview appearance={appearance} width={width} samples={samples} />
            </DemoSection>
          ))}
          <AxisHeading
            letter="Q"
            title="Очередь и таймеры"
            description="Интерактивный прогон утверждённых правил. Обычный результат — 5 с, предупреждение — 8 с, ошибка, безопасность и отмена — 10 с; PWA постоянно. Время очереди не расходуется."
          />
          <DemoSection
            code="Q1"
            title="Общий лимит, защита и отложенные события"
            description="Добавляйте сообщения по одному или загрузите готовый сценарий. После читалки первые три события показываются сразу, четвёртое ждёт свободного места. Повтор сбоя не создаёт новую карточку."
            pros={[
              'Отмена и безопасность сохраняют своё место',
              'PWA уступает слот без отказа пользователя',
              'Каждое отложенное событие получает показ',
            ]}
            cons={['Если все три слота защищены, новые сообщения ждут']}
          >
            <QueueDemo />
          </DemoSection>
          <AxisHeading
            letter="C"
            title="Выравнивание заголовка"
            description="Сравнение на выбранной базе: иконка 32 px, крестик 28 px и строка текста около 20 px. C1 меняет только простые сообщения, C2 собирает общую верхнюю строку у всех тостов. Крестик сохраняет текущий вид."
          />
          {ALIGNMENT_VARIANTS.map(({ appearance, width, samples, ...variant }) => (
            <DemoSection key={variant.code} {...variant}>
              <AppearancePreview appearance={appearance} width={width} samples={samples} />
            </DemoSection>
          ))}
          <ResultSection />
        </Stack>
      </Group>
    </Stack>
  );
}

export default PlaygroundGlobalToasts;
