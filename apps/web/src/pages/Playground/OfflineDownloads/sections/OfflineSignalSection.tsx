import { Group, Stack } from '@mantine/core';
import AxisHeading from '../../Notifications/components/AxisHeading';
import Frames from '../../Notifications/components/Frames';
import DemoSection from '../../components/DemoSection';
import AccountMenuMock from '../components/AccountMenuMock';
import AppChromeMock from '../components/AppChromeMock';
import NetworkToast from '../components/NetworkToast';
import { OFFLINE_SIGNAL } from '../models';

/** N — как приложение говорит, что сети нет. */
function OfflineSignalSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="N"
        title="Индикация «Нет сети»"
        description="Шапка и закладки из кеша без сети. Во всех вариантах тосты сетевых ошибок без сети не показываются — иначе каждый запрос сыплет красными тостами; блок, чей запрос упал, показывает своё пустое состояние (ось U)."
      />
      <DemoSection
        code="N1"
        title="Значок в шапке"
        description="Золотое перечёркнутое облако слева от закладок и колокольчика, на телефоне — рядом с аватаром. Подсказка «Нет сети — доступно скачанное», клик ведёт в «Загрузки»."
        pros={['Не отнимает места, в читалке не мешает', 'Видно всё время, пока сети нет']}
        cons={[
          'Маленький значок легко не заметить',
          'На телефоне подсказки нет — смысл только по значку',
        ]}
      >
        <Frames>
          <AppChromeMock signal={OFFLINE_SIGNAL.ICON} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="N2"
        title="Полоса под шапкой"
        description="Узкая золотая полоса во всю ширину: «Нет сети — доступно скачанное» и ссылка «Загрузки»."
        pros={['Невозможно не заметить', 'Сразу говорит, что делать']}
        cons={['Отнимает 32 px высоты на каждой странице', 'В читалке её придётся прятать']}
      >
        <Frames>
          <AppChromeMock signal={OFFLINE_SIGNAL.STRIP} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="N2a"
        title="N2, обычный текст и кнопка"
        description="Фон как у N2, но текст обычного цвета (белый в тёмной теме), золотая только иконка; «Загрузки» — маленькая кнопка muted вместо ссылки."
        pros={[
          'Текст читается в обеих темах',
          'Путь в «Загрузки» — явная кнопка, а не ссылка в строке',
        ]}
        cons={[
          'Кнопка делает полосу чуть выше',
          'Как любая полоса, отнимает высоту — в читалке её нет',
        ]}
      >
        <Frames>
          <AppChromeMock signal={OFFLINE_SIGNAL.STRIP_BUTTON} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="N2b"
        title="N2a со ссылкой золотом"
        description="Полоса N2a, но «Загрузки» — ссылка со значком золотом, как иконка облака, а не кнопка."
        pros={['Полоса ниже, чем с кнопкой', 'Ссылка в тон полосы, ничего лишнего по цвету']}
        cons={[
          'Ближе всего к исходному N2, который читался грязным; разница — только в цвете фразы',
        ]}
      >
        <Frames>
          <AppChromeMock signal={OFFLINE_SIGNAL.STRIP_LINK_GOLD} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="N2c"
        title="N2a со ссылкой акцентом"
        description="Полоса N2a, «Загрузки» — ссылка со значком в акцентном цвете, как ссылки в остальном приложении."
        pros={['Сразу понятно, что это ссылка', 'Отделяется от фразы сильнее, чем золото']}
        cons={['Акцент на золотом фоне — два цвета в одной узкой полосе']}
      >
        <Frames>
          <AppChromeMock signal={OFFLINE_SIGNAL.STRIP_LINK_ACCENT} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="N2d"
        title="N2a со ссылкой цветом текста"
        description="Полоса N2a, «Загрузки» — ссылка со значком цветом текста, жирная и подчёркнутая."
        pros={['Самая спокойная полоса: золотое только облако']}
        cons={['От фразы рядом ссылку отличают лишь жирность и подчёркивание']}
      >
        <Frames>
          <AppChromeMock signal={OFFLINE_SIGNAL.STRIP_LINK_TEXT} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="N3"
        title="Тосты"
        description="Постоянной индикации нет: тост «Нет сети», когда сеть пропала, и «Сеть вернулась», когда появилась."
        pros={[
          'Ноль постоянного интерфейса',
          'Сообщает и о возвращении сети с отправкой прогресса',
        ]}
        cons={[
          'Через несколько секунд уже не понять, есть ли сеть',
          'При холодном старте без сети тост увидят, но не поймут, откуда пустые блоки',
        ]}
      >
        <Group gap="md" align="flex-start">
          <NetworkToast isOnline={false} />
          <NetworkToast isOnline />
        </Group>
      </DemoSection>
      <DemoSection
        code="N4"
        title="Шапка меняет вид"
        description="Ничего не добавляется — шапка без сети становится серой и бледной, логотип теряет цвет."
        pros={['Без новых элементов', 'Видно на любой странице']}
        cons={['Неочевидно: похоже на сбой темы или неактивное окно', 'Не объясняет, что доступно']}
      >
        <Frames>
          <AppChromeMock signal={OFFLINE_SIGNAL.MUTED_HEADER} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="N5"
        title="Полоса насыщеннее"
        description="Как N2, но фон золота заметнее, снизу золотая линия, текст обычного цвета; золотые только иконка и «Загрузки»."
        pros={['Читается как состояние, а не как грязный фон', 'Текст контрастный в обеих темах']}
        cons={['В тёмной теме золото на тёмном всё равно бросается в глаза']}
      >
        <Frames>
          <AppChromeMock signal={OFFLINE_SIGNAL.STRIP_STRONG} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="N6"
        title="Нейтральная полоса"
        description="Серый слой интерфейса с линией снизу; золотая только иконка, ссылка — акцентом."
        pros={['Спокойно, в цветах приложения', 'Не спорит с акцентными кнопками страницы']}
        cons={['Меньше говорит о том, что что-то не так']}
      >
        <Frames>
          <AppChromeMock signal={OFFLINE_SIGNAL.STRIP_NEUTRAL} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="N7"
        title="Капсула под шапкой"
        description="Полосы нет — по центру под шапкой висит капсула «Нет сети · Загрузки» с тенью, поверх начала страницы."
        pros={['Почти не отнимает высоту', 'Заметна за счёт тени и положения']}
        cons={['Перекрывает начало страницы', 'Такого элемента в приложении больше нет']}
      >
        <Frames>
          <AppChromeMock signal={OFFLINE_SIGNAL.CAPSULE} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="N8"
        title="Бейдж в шапке"
        description="Золотой бейдж «Нет сети» рядом с логотипом, клик ведёт в «Загрузки»."
        pros={['Ноль лишней высоты', 'Заметнее значка N1 за счёт слова']}
        cons={['На телефоне шапка теснее', '«Загрузки» словом не видно — путь только по клику']}
      >
        <Frames>
          <AppChromeMock signal={OFFLINE_SIGNAL.HEADER_BADGE} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="N9a"
        title="Залитое золото, скругление снизу"
        description="Полоса свисает из шапки, нижние углы скруглены; фон — сплошное золото, текст и иконка тёмные, «Загрузки» подчёркнуто."
        pros={['Заметнее всех, в обеих темах', 'Форма «язычка» отделяет полосу от страницы']}
        cons={['Кричит — пока нет сети, оттягивает внимание с каждой страницы']}
      >
        <Frames>
          <AppChromeMock signal={OFFLINE_SIGNAL.TAB_GOLD} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="N9b"
        title="Инверсия, скругление снизу"
        description="Тёмная плашка в светлой теме и светлая в тёмной, золотая только иконка — как системное «Нет подключения»."
        pros={['Контрастно, но не тревожно', 'Похоже на статус системы, а не на рекламу']}
        cons={['Такого элемента в приложении больше нет']}
      >
        <Frames>
          <AppChromeMock signal={OFFLINE_SIGNAL.TAB_INVERTED} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="N9c"
        title="Акцентный тон, скругление снизу"
        description="Терракотовый muted, как у тегов: фон и рамка цвета акцента, иконка и «Загрузки» — акцентом."
        pros={['В цветах приложения', 'Рамка даёт чёткий край в обеих темах']}
        cons={['Акцент обычно значит действие — полосу можно принять за баннер']}
      >
        <Frames>
          <AppChromeMock signal={OFFLINE_SIGNAL.TAB_ACCENT} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="N9d"
        title="Язычок по центру"
        description="Не во всю ширину: по ширине текста, по центру, свисает из шапки; золото muted с рамкой. На телефоне текст короче — «Нет сети · Загрузки»."
        pros={['Почти не отнимает места, ничего не перекрывает', 'Мягче полосы во всю ширину']}
        cons={['На телефоне фраза сокращается', 'Узкий язычок легче не заметить, чем полосу']}
      >
        <Frames>
          <AppChromeMock signal={OFFLINE_SIGNAL.TAB_CENTER} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="N9c1"
        title="N9c без линии шапки"
        description="Пока нет сети, серая линия под шапкой исчезает — полоса продолжает шапку; рамка у полосы только по бокам и снизу."
        pros={['Читается как часть шапки, а не отдельный блок']}
        cons={['Пропадает граница шапки — правда, только пока нет сети']}
      >
        <Frames>
          <AppChromeMock signal={OFFLINE_SIGNAL.TAB_ACCENT_NO_LINE} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="N9c2"
        title="N9c без рамки"
        description="Линия шапки остаётся, у полосы только заливка со скруглённым низом."
        pros={['Меньше линий — меньше швов']}
        cons={['В светлой теме край заливки мягкий, полоса может «плыть»']}
      >
        <Frames>
          <AppChromeMock signal={OFFLINE_SIGNAL.TAB_ACCENT_FILL} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="N9c3"
        title="N9c, линия шапки в цвет рамки"
        description="Серая линия под шапкой перекрашивается в цвет рамки полосы — один контур на шапку и полосу."
        pros={['Один цвет линий — видно, что это целое']}
        cons={['Акцентная линия во всю ширину заметна сама по себе']}
      >
        <Frames>
          <AppChromeMock signal={OFFLINE_SIGNAL.TAB_ACCENT_LINE} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="N9c4"
        title="N9c, шапка в том же тоне"
        description="Пока нет сети, шапка получает тот же акцентный фон, и вместе с полосой это один блок со скруглённым низом."
        pros={['Слито полностью, другой режим заметен сразу']}
        cons={['Меняется вид шапки на всех страницах — ближе к N4, только в цвете']}
      >
        <Frames>
          <AppChromeMock signal={OFFLINE_SIGNAL.TAB_ACCENT_HEADER} />
        </Frames>
      </DemoSection>
      <DemoSection
        code="N10"
        title="Поиск в шапке"
        description="Поле поиска само говорит о режиме: облако вместо лупы и «Нет сети — ищем среди скачанного». На телефоне, где поля в шапке нет, — облако на иконке поиска."
        pros={[
          'Ни одного нового элемента',
          'Объясняет ровно то, что изменилось: поиск и каталог идут по скачанному',
        ]}
        cons={[
          'Плейсхолдер исчезает, как только начинаешь печатать',
          'На телефоне значок мелкий, а «Загрузок» не видно',
        ]}
      >
        <Stack gap="md">
          <Frames>
            <AppChromeMock signal={OFFLINE_SIGNAL.SEARCH} />
          </Frames>
        </Stack>
      </DemoSection>
      <DemoSection
        code="N11"
        title="Кнопка «Загрузки» в шапке"
        description="Без сети в шапке появляется кнопка «Нет сети · Загрузки», в нижней панели телефона — «Загрузки». Индикатор и выход одним элементом."
        pros={['Сразу ведёт туда, где всё работает', 'Не отнимает высоту']}
        cons={[
          'Шапка меняет состав, пока нет сети',
          'В нижней панели телефона становится шесть пунктов',
        ]}
      >
        <Stack gap="md">
          <Frames>
            <AppChromeMock signal={OFFLINE_SIGNAL.DOWNLOADS_BUTTON} />
          </Frames>
        </Stack>
      </DemoSection>
      <DemoSection
        code="N12"
        title="Постоянная плашка внизу"
        description="Как «Вы не в сети» в Google Docs: небольшая плашка в левом нижнем углу (на телефоне — над нижней панелью), висит, пока нет сети. Шапка не меняется."
        pros={['Шапка и раскладка страниц не трогаются', 'Заметна, но не на пути глаз сверху']}
        cons={[
          'Перекрывает низ страницы — карточки и кнопки под ней',
          'В читалке её придётся прятать',
        ]}
      >
        <Stack gap="md">
          <Frames>
            <AppChromeMock signal={OFFLINE_SIGNAL.SNACKBAR} />
          </Frames>
        </Stack>
      </DemoSection>
      <DemoSection
        code="N13"
        title="Статус на аватаре"
        description="Золотой значок облака в углу аватара; в меню аккаунта первой строкой «Нет сети — доступно скачанное», ниже пункт «Загрузки»."
        pros={[
          'Самый тихий: как статус «не в сети» в мессенджерах',
          'Работает одинаково на десктопе и телефоне',
        ]}
        cons={['Значок на аватаре легко не заметить', 'Пояснение — только в меню']}
      >
        <Stack gap="md">
          <Frames>
            <AppChromeMock signal={OFFLINE_SIGNAL.AVATAR_STATUS} />
          </Frames>
          <AccountMenuMock isOffline />
        </Stack>
      </DemoSection>
      <DemoSection
        code="N14"
        title="Как N6, фон шапки и акцент"
        description="Полоса во всю ширину под шапкой с серой линией снизу, фон — как у шапки, иконка и «Загрузки» акцентным цветом, текст обычный."
        pros={[
          'Не отделяется от шапки цветом — выглядит её второй строкой',
          'Акцент там же, где он и так значит «действие» — на ссылке',
        ]}
        cons={[
          'Состояние «что-то не так» читается слабее, чем у золота',
          'Отнимает 32 px высоты, как любая полоса',
        ]}
      >
        <Stack gap="md">
          <Frames>
            <AppChromeMock signal={OFFLINE_SIGNAL.STRIP_HEADER} />
          </Frames>
        </Stack>
      </DemoSection>
    </Stack>
  );
}

export default OfflineSignalSection;
