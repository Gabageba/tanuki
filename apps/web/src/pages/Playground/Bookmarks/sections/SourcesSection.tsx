import { Stack } from '@mantine/core';
import DemoSection from '../../components/DemoSection';
import AxisHeading from '../components/AxisHeading';
import CardsDemo from '../components/CardsDemo';
import { MOCK_SOURCES_BOOKMARKS } from '../mocks';
import { CARD_VARIANT, SOURCES_VARIANT } from '../models';

/** Ось Q — как на карточке закладки открыть другие источники группы. */
function SourcesSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="Q"
        title="Другие источники на карточке"
        description="Карточка C10h с четырьмя закладками: пять источников, два, один при длинном названии, 18+ с тремя. Нажмите на элемент источников: всё, кроме него, ведёт на тайтл. В рамке телефона попробуйте попасть пальцем — зона нажатия у кнопок в мета-строке шире видимой."
      />
      <DemoSection
        code="Q0"
        title="Как сейчас — «+N» внахлёст"
        description="Иконка источника, куда ведёт карточка, и наложенный на неё серый квадрат «+N», как у Avatar.Group в Mantine. По нажатию — меню источников."
        cons={[
          'Похоже на метку, а не на кнопку: не видно, что можно нажать',
          '«+N» мелкий и серый — на тёмной теме почти сливается',
          'Не ясно, что откроется: тайтл, как у остальной карточки, или список',
        ]}
      >
        <CardsDemo
          bookmarks={MOCK_SOURCES_BOOKMARKS}
          variant={CARD_VARIANT.TITLE_DOT_FIRST_LINE}
          sourcesVariant={SOURCES_VARIANT.OVERLAP}
        />
      </DemoSection>
      <DemoSection
        code="Q1"
        title="Чип в рамке"
        description="Иконка, «+N» и стрелка вниз в одной кнопке с рамкой высотой 24 px — стандартная Mantine-кнопка. Один источник — просто иконка без рамки: нажимать нечего."
        pros={[
          'Рамка и стрелка говорят «кнопка, откроется список» — без подписи',
          '«+N» обычным текстом рядом с иконкой, а не поверх неё',
          'Наведение подсвечивает чип, как любую кнопку приложения',
        ]}
        cons={[
          'Мета-строка шире на ~20 px — на узкой карточке прогресс обрежется раньше',
          'Карточки с одним и с несколькими источниками начинаются по-разному',
        ]}
      >
        <CardsDemo
          bookmarks={MOCK_SOURCES_BOOKMARKS}
          variant={CARD_VARIANT.TITLE_DOT_FIRST_LINE}
          sourcesVariant={SOURCES_VARIANT.CHIP}
        />
      </DemoSection>
      <DemoSection
        code="Q1b"
        title="Чип, на телефоне — список снизу"
        description="Тот же чип, что в Q1. В рамке телефона по нажатию снизу выезжает список источников строками по 48 px, на десктопе — меню, как в Q1."
        pros={[
          'На телефоне легко попасть и в чип, и в нужный источник',
          'Список снизу — под большим пальцем, а не у края карточки',
        ]}
        cons={[
          'Один и тот же список выглядит по-разному на телефоне и десктопе',
          'Для двух-трёх источников выезжающая панель — тяжеловато',
        ]}
      >
        <CardsDemo
          bookmarks={MOCK_SOURCES_BOOKMARKS}
          variant={CARD_VARIANT.TITLE_DOT_FIRST_LINE}
          sourcesVariant={SOURCES_VARIANT.CHIP_DRAWER}
        />
      </DemoSection>
      <DemoSection
        code="Q2"
        title="«ещё N» словами"
        description="Иконка источника остаётся просто иконкой, частью карточки. В конце мета-строки — ссылка «ещё 2 ▾» цветом ссылок, она и открывает меню."
        pros={[
          'Слова понятнее числа: сразу ясно, что «ещё» — это источники',
          'Иконка больше не спорит с карточкой за нажатие',
          'Цвет ссылки — привычный знак «на это можно нажать»',
        ]}
        cons={[
          'Самая длинная мета-строка: на узкой карточке «ещё N» обрежется первым',
          'Ссылка далеко от иконки — связь «ещё 2 источника» читается не сразу',
        ]}
      >
        <CardsDemo
          bookmarks={MOCK_SOURCES_BOOKMARKS}
          variant={CARD_VARIANT.TITLE_DOT_FIRST_LINE}
          sourcesVariant={SOURCES_VARIANT.WORDS}
        />
      </DemoSection>
      <DemoSection
        code="Q3"
        title="Плашка на обложке"
        description="Тёмная полупрозрачная плашка «⧉ +2 ▾» высотой 28 px в левом нижнем углу обложки — он на карточке закладки свободен. В мета-строке — просто иконка источника."
        pros={[
          'Самая крупная цель — легко попасть пальцем',
          'Мета-строка не меняется, прогресс не обрезается',
          'Видна на картинке сразу, даже при беглом взгляде',
        ]}
        cons={[
          'Ещё одна метка поверх обложки',
          'На маленькой обложке в списке плашке тесно',
          'Число источников оторвано от иконки источника в мета-строке',
        ]}
      >
        <CardsDemo
          bookmarks={MOCK_SOURCES_BOOKMARKS}
          variant={CARD_VARIANT.TITLE_DOT_FIRST_LINE}
          sourcesVariant={SOURCES_VARIANT.COVER}
        />
      </DemoSection>
      <DemoSection
        code="Q4"
        title="Меню «⋯» карточки"
        description="Справа в мета-строке — кнопка «⋯» на каждой карточке. В меню — «Открыть на источнике» со списком (если их больше одного), «Перенести в папку» и «Убрать из закладок». У иконки нет «+N»."
        pros={[
          '«⋯» знакома всем: понятно, что откроется меню действий',
          'Все действия с закладкой в одном месте, без захода на тайтл',
          'Кнопка у правого края — далеко от остальной карточки, промахнуться трудно',
        ]}
        cons={[
          'Не видно, что источников несколько, пока не откроешь меню',
          'Перенос и удаление прямо с карточки — новые действия, которых в плане не было',
          'Кнопка на каждой карточке — даже где источник один',
        ]}
      >
        <CardsDemo
          bookmarks={MOCK_SOURCES_BOOKMARKS}
          variant={CARD_VARIANT.TITLE_DOT_FIRST_LINE}
          sourcesVariant={SOURCES_VARIANT.CARD_MENU}
        />
      </DemoSection>
    </Stack>
  );
}

export default SourcesSection;
