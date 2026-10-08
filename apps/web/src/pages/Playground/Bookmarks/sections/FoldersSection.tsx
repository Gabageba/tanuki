import { Stack, Text } from '@mantine/core';
import DemoSection from '../../components/DemoSection';
import AxisHeading from '../components/AxisHeading';
import MergeDemo from '../components/MergeDemo';
import PickerDemo from '../components/PickerDemo';
import ProfileFoldersCard from '../components/ProfileFoldersCard';
import SettingsFoldersMock from '../components/SettingsFoldersMock';
import { ICON_PICKER_VARIANT, MERGE_VARIANT, PROFILE_VARIANT } from '../models';

/** Оси F — папки в настройках, P — выбор иконки и цвета, G — блок в профиле, M — склейка. */
function FoldersSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="F"
        title="Вкладка «Закладки» в настройках"
        description="Список папок как список источников. У встроенных — только порядок и тумблер, у своих — меню «Переименовать» / «Удалить». Меню живое: «Удалить» у «Любимого» (5 тайтлов) спрашивает, куда их деть, у «Перечитать…» (пусто) — просто подтверждает. «Новая папка» — в подвале списка."
      />
      <DemoSection
        code="F1"
        title="Строка как у источника"
        description="Ручка, иконка, название; справа тумблер «Следить за обновлениями» и меню. Что значит тумблер — сказано один раз в шапке списка."
        pros={[
          'Такая же строка, как в соседней вкладке «Источники»',
          'Компактно — все папки на одном экране',
        ]}
        cons={['Сколько тайтлов в папке — не видно, удалять приходится вслепую']}
      >
        <Stack maw={640}>
          <SettingsFoldersMock withCount={false} />
        </Stack>
      </DemoSection>
      <DemoSection
        code="F2"
        title="С числом тайтлов"
        description="То же, под названием — «12 тайтлов» или «Пусто». Ниже — то же при лимите: 20 своих папок, «Новая папка» неактивна, тултип объясняет."
        pros={[
          'Перед удалением видно, что в папке',
          'Подсказывает пустые папки, которые можно убрать',
        ]}
        cons={['Строки выше, число повторяет вкладку на /bookmarks']}
      >
        <Stack maw={640} gap="xl">
          <SettingsFoldersMock withCount />
          <Stack gap={6}>
            <Text fz={12} c="dimmed">
              Лимит: 20 своих папок
            </Text>
            <SettingsFoldersMock withCount isLimitReached />
          </Stack>
        </Stack>
      </DemoSection>

      <AxisHeading
        letter="P"
        title="Выбор иконки и цвета в модалке папки"
        description="Модалка «Новая папка» / «Переименовать» — тон neutral: иконка папки у заголовка, поле названия с иконкой выбранной папки, выбор иконки и цвета, тумблер. Валидация под полем: пусто, длиннее 32, занято (в том числе «Читаю» и другие встроенные)."
      />
      <DemoSection
        code="P1"
        title="Иконки серые, цвета отдельно"
        description="Сетка серых иконок — выбранная в рамке и залита; ниже кружки цветов. Итог виден в поле названия."
        pros={[
          'Иконки одинаково читаются при любом цвете',
          'Привычная раскладка: «что» и «каким цветом» отдельно',
        ]}
        cons={['Итог виден только в одной иконке у поля']}
      >
        <PickerDemo variant={ICON_PICKER_VARIANT.SEPARATE} />
      </DemoSection>
      <DemoSection
        code="P2"
        title="Цвет сверху, иконки уже в нём"
        description="Сначала цвет, под ним сетка иконок, окрашенных выбранным цветом; выбранная — залита."
        pros={[
          'Сразу видно, как будет выглядеть папка',
          'Сетка заодно показывает цвет на разных формах',
        ]}
        cons={[
          'В светлых цветах (жёлтый, лайм) иконки хуже читаются',
          'Сетка целиком цветная — пёстро',
        ]}
      >
        <PickerDemo variant={ICON_PICKER_VARIANT.TINTED} />
      </DemoSection>

      <AxisHeading
        letter="G"
        title="Блок «Закладки» в профиле"
        description="Вкладка статистики: сколько тайтлов в каждой папке, клик по папке ведёт на /bookmarks с этой вкладкой."
      />
      <DemoSection
        code="G1"
        title="ProgressList"
        description="Как карточка источников в статистике: название, полоса доли, число."
        pros={['Тот же компонент, что рядом в статистике', 'Доли сравниваются на глаз']}
        cons={['Полосы серые — цвет папки только в иконке', 'Пустая папка — пустая полоса, шум']}
      >
        <Stack maw={520}>
          <ProfileFoldersCard variant={PROFILE_VARIANT.PROGRESS_LIST} />
        </Stack>
      </DemoSection>
      <DemoSection
        code="G2"
        title="Строки со стрелкой"
        description="Список-навигация: иконка, название, число и стрелка — понятно, что строка ведёт дальше."
        pros={['Явно кликабельно', 'Длинные названия помещаются']}
        cons={['Нет картинки долей — блок статистики без статистики']}
      >
        <Stack maw={520}>
          <ProfileFoldersCard variant={PROFILE_VARIANT.ROWS} />
        </Stack>
      </DemoSection>
      <DemoSection
        code="G3"
        title="Составная полоса и легенда"
        description="Одна полоса из сегментов цвета папок и легенда в две колонки."
        pros={['Цвета папок работают — блок узнаваем', 'Видно целое: какая доля «В планах»']}
        cons={[
          'Маленькие папки — тонкие сегменты, их не различить',
          'Серое «Брошено» сливается с фоном полосы',
        ]}
      >
        <Stack maw={520}>
          <ProfileFoldersCard variant={PROFILE_VARIANT.STACKED_BAR} />
        </Stack>
      </DemoSection>

      <AxisHeading
        letter="M"
        title="Модалка склейки"
        description="Пользователь подтверждает связь «Ван Пис» MangaLib ↔ Remanga, а копии лежат в «Читаю» и «Любимое». Тон warning: ничего не теряется, но одна закладка переезжает."
      />
      <DemoSection
        code="M1"
        title="Две карточки-радио"
        description="Обе папки карточками Radio.Card с подписью, на каком источнике тайтл так лежит; выбранная — как везде в приложении (tile: акцентная рамка и подложка, индикатор outline). Кнопка «Связать» цвета тона."
        pros={[
          'Оба варианта видны сразу, без раскрытия',
          'Подпись объясняет, откуда взялись две папки',
        ]}
        cons={['Самая высокая модалка']}
      >
        <MergeDemo variant={MERGE_VARIANT.RADIO_CARDS} />
      </DemoSection>
      <DemoSection
        code="M1a"
        title="Карточки, иконка в цвет карточки"
        description="Как M1, но иконка папки без своего цвета: у выбранной она акцентная вместе с названием, у второй — серая. Один цвет на выбранной карточке."
        pros={['Как остальные tile-карточки приложения — ничего не спорит с подложкой']}
        cons={['Цвета папки в модалке нет — только форма иконки и название']}
      >
        <MergeDemo variant={MERGE_VARIANT.RADIO_CARDS_INHERIT} />
      </DemoSection>
      <DemoSection
        code="M1b"
        title="Карточки без подложки"
        description="У выбранной только акцентная рамка и индикатор, фон не меняется; иконка — цветом папки, название — обычным."
        pros={['Цвет папки остаётся и ни с чем не сталкивается']}
        cons={['Расходится с tile-карточками приложения — выбор выделен слабее']}
      >
        <MergeDemo variant={MERGE_VARIANT.RADIO_CARDS_BORDER} />
      </DemoSection>
      <DemoSection
        code="M1c"
        title="Карточки, у выбранной иконка залита"
        description="Подложка и рамка tile остаются; иконка папки — её цветом, у выбранной — белая в плашке цвета папки, как метка K2 и выбранный пункт «В закладки». Название обычным цветом."
        pros={[
          'И цвет папки, и выделение выбора на месте',
          'Тот же приём, что в «В закладки» и меню читалки',
        ]}
        cons={['На выбранной два цвета — иконка папки на акцентной подложке']}
      >
        <MergeDemo variant={MERGE_VARIANT.RADIO_CARDS_PLATE} />
      </DemoSection>
      <DemoSection
        code="M1d"
        title="Выбранная карточка в цвете папки"
        description="Как выбранный пункт «В закладки» (S4): подложка, рамка, название и индикатор выбранной карточки — цветом её папки, иконки контурные своим цветом."
        pros={[
          'Один цвет на выбранной карточке — цвет папки',
          'Тот же приём, что в «В закладки» и меню читалки',
        ]}
        cons={['Отходит от общего вида tile-карточек — они терракотовые']}
      >
        <MergeDemo variant={MERGE_VARIANT.RADIO_CARDS_FOLDER_TINT} />
      </DemoSection>
      <DemoSection
        code="M2"
        title="Select"
        description="Один Select с двумя пунктами «Читаю — как на MangaLib»."
        pros={['Компактно']}
        cons={[
          'Из двух вариантов один спрятан в списке — лишний клик',
          'Длинный пункт с источником обрезается',
        ]}
      >
        <MergeDemo variant={MERGE_VARIANT.SELECT} />
      </DemoSection>
      <DemoSection
        code="M3"
        title="Две кнопки-папки"
        description="Вместо выбора и «Связать» — сразу «В «Читаю»» и «В «Любимое»»: выбор и подтверждение одним нажатием."
        pros={['Один клик вместо двух']}
        cons={[
          'Нет кнопки цвета тона — расходится с правилом модалок',
          'Длинные названия папок не влезают в кнопки на телефоне',
        ]}
      >
        <MergeDemo variant={MERGE_VARIANT.BUTTONS} />
      </DemoSection>
    </Stack>
  );
}

export default FoldersSection;
