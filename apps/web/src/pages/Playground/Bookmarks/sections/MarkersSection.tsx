import { Stack } from '@mantine/core';
import DemoSection from '../../components/DemoSection';
import AxisHeading from '../components/AxisHeading';
import CatalogMarkersDemo from '../components/CatalogMarkersDemo';
import NavDotMock from '../components/NavDotMock';
import NewChaptersDemo from '../components/NewChaptersDemo';
import { DOT_VARIANT, MARKER_VARIANT, NEW_CHAPTER_VARIANT } from '../models';

/** Оси K — метка на карточке каталога, N — новая глава в списке, D — точка в шапке и футере. */
function MarkersSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="K"
        title="Метка «в закладках» на карточке каталога"
        description="Карточки: «Ван Пис» в «Читаю», «Ночной сад» 18+ в «Любимое», «Поднятие уровня» в «Брошено», «Берсерк» не в закладках и без рейтинга. Второй ряд — карточки поиска с диагональной лентой источника."
      />
      <DemoSection
        code="K0"
        title="Как сейчас"
        description="Меток нет."
        cons={[
          'Из каталога не понять, что тайтл уже сохранён — легко добавить ещё раз или открыть ради проверки',
        ]}
      >
        <CatalogMarkersDemo variant={null} />
      </DemoSection>
      <DemoSection
        code="K1"
        title="Флажок закладки сверху"
        description="Залитая закладка акцентного цвета свисает с верхнего края слева, как вложенная в книгу. В поиске, где слева лента источника, — справа, рядом с 18+."
        pros={[
          'Читается без подписи — это закладка',
          'Не спорит с рейтингом и 18+ внизу',
          'Одна для всех папок — спокойно',
        ]}
        cons={[
          'В поиске меняет сторону из-за ленты',
          'Какая папка — не видно',
          'Терракота на обложке рядом с терракотовой звездой рейтинга',
        ]}
      >
        <CatalogMarkersDemo variant={MARKER_VARIANT.BOOKMARK} />
      </DemoSection>
      <DemoSection
        code="K2"
        title="Иконка папки в её цвете"
        description="Квадратная плашка цвета папки с белой иконкой — в левом нижнем углу, напротив рейтинга."
        pros={[
          'Видно, в какой папке: «Брошено» отличается от «Читаю»',
          'Один угол во всех контекстах — в поиске тоже',
        ]}
        cons={['Разноцветные плашки по сетке каталога — шумно', 'Иконку своей папки надо помнить']}
      >
        <CatalogMarkersDemo variant={MARKER_VARIANT.FOLDER_ICON} />
      </DemoSection>
      <DemoSection
        code="K3"
        title="Иконка и название папки"
        description="Пилюля цвета папки с иконкой и названием — в левом нижнем углу, до рейтинга."
        pros={['Без догадок — написано словами']}
        cons={[
          'На узкой карточке (телефон) название обрезается почти целиком',
          'Самая громкая метка — обложку перекрывает текст',
        ]}
      >
        <CatalogMarkersDemo variant={MARKER_VARIANT.FOLDER_PILL} />
      </DemoSection>

      <AxisHeading
        letter="N"
        title="Новые главы в списке глав"
        description="Сортировка «сначала новые»: 1093–1091 вышли после прошлого визита, своя отметка на 1090 (кольцо A2e). Пометка держится, пока открыта страница."
      />
      <DemoSection
        code="N0"
        title="Как сейчас"
        description="Пометки нет — новые главы видно только по положению над своей отметкой."
        cons={[
          'После визита в /bookmarks с «+3» не найти, какие именно главы новые, если читал не по порядку',
        ]}
      >
        <NewChaptersDemo variant={null} />
      </DemoSection>
      <DemoSection
        code="N1"
        title="NEW справа, перед датой"
        description="Моноширинный бейдж NEW в правой колонке, рядом с датой выхода — тоже про «когда вышла»."
        pros={['Номер и название не сдвигаются', 'Стоит рядом с датой — по смыслу']}
        cons={['Взгляд идёт по левой колонке номеров, правую замечаешь не сразу']}
      >
        <NewChaptersDemo variant={NEW_CHAPTER_VARIANT.BADGE_RIGHT} />
      </DemoSection>
      <DemoSection
        code="N2"
        title="NEW за номером"
        description="Бейдж сразу за номером, перед названием."
        pros={['Замечаешь вместе с номером — там, куда смотришь']}
        cons={[
          'Названия новых глав сдвигаются и не стоят колонкой с остальными',
          'На телефоне название обрезается раньше',
        ]}
      >
        <NewChaptersDemo variant={NEW_CHAPTER_VARIANT.BADGE_NUMBER} />
      </DemoSection>
      <DemoSection
        code="N3"
        title="Точка у узла"
        description="Маленькая акцентная точка у правого верхнего края узла на линии."
        pros={[
          'Ничего не сдвигается и не добавляет текста',
          'Живёт на линии прогресса — там, где про чтение',
        ]}
        cons={[
          'Без подписи смысл точки неочевиден',
          'Спорит с кольцом своей отметки и иконками чужих отметок A2e',
        ]}
      >
        <NewChaptersDemo variant={NEW_CHAPTER_VARIANT.NODE_DOT} />
      </DemoSection>

      <AxisHeading
        letter="D"
        title="Точка в шапке и футере"
        description="Горит, пока хоть у одной закладки в отслеживаемой папке есть новые главы. Иконка в шапке становится ссылкой на /bookmarks с тултипом «Закладки». Футер — открыты «Источники» и открыты «Закладки»."
      />
      <DemoSection
        code="D1"
        title="Точка"
        description="Маленькая акцентная точка у угла иконки."
        pros={['Тихо: сообщает «есть новое» и не требует внимания']}
        cons={['На светлой теме у края иконки сливается со штрихом']}
      >
        <NavDotMock variant={DOT_VARIANT.DOT} />
      </DemoSection>
      <DemoSection
        code="D2"
        title="Точка с вырезом"
        description="Та же точка чуть крупнее, обведена цветом фона — отделена от иконки, как бейдж на иконке приложения."
        pros={['Читается на любой иконке и в обеих темах', 'Всё ещё без числа — спокойно']}
        cons={['Крупнее D1 — заметнее, чем нужно для необязательного']}
      >
        <NavDotMock variant={DOT_VARIANT.CUTOUT} />
      </DemoSection>
      <DemoSection
        code="D3"
        title="Число закладок с новым"
        description="Вместо точки — число закладок с новыми главами."
        pros={['Сразу видно масштаб']}
        cons={[
          'Число зовёт «обнулить» — давит, хотя новые главы не задача',
          'Будущий колокольчик с числом рядом — два счётчика подряд',
        ]}
      >
        <NavDotMock variant={DOT_VARIANT.COUNT} />
      </DemoSection>
    </Stack>
  );
}

export default MarkersSection;
