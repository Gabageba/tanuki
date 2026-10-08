import { Stack } from '@mantine/core';
import DemoSection from '../../components/DemoSection';
import AxisHeading from '../components/AxisHeading';
import CurrentTitleActions from '../components/CurrentTitleActions';
import PickerStates from '../components/PickerStates';
import ReaderStates from '../components/ReaderStates';
import VariantState from '../components/VariantState';
import { PICKER_VARIANT, READER_VARIANT } from '../models';

/** Оси S — выбор папки на странице тайтла, R — кнопка в читалке. */
function TitleSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="S"
        title="«В закладки» на странице тайтла"
        description="Под «Продолжить». Всё живое: выбор папки переносит закладку сразу, «Убрать из закладок» — без модалки, с тостом «Убрано из закладок» и «Вернуть». Пункт «Убрать» есть только у тайтла в закладках."
      />
      <DemoSection
        code="S0"
        title="Как сейчас"
        description="Select с одним пунктом «Читаю» в терракоте — заглушка, ничего не сохраняет."
        cons={['Не видно, в закладках тайтл или нет', 'Терракота — цвет действий, а тут статус']}
      >
        <VariantState label="Заглушка">
          <CurrentTitleActions />
        </VariantState>
      </DemoSection>
      <DemoSection
        code="S1"
        title="Select, «Убрать» красным за чертой"
        description="Поле как Select: плейсхолдер «В закладки» с контурной закладкой, выбранная папка — её иконкой и цветом. В списке иконки папок контурные, у выбранной — белая в плашке цвета папки, как метка K2 на карточке; в поле — так же. «Убрать из закладок» — в подвале списка, красным."
        pros={[
          'Выглядит как поле — сразу видно текущее значение',
          'Красный отделяет удаление от выбора папки',
        ]}
        cons={[
          'Красный пугает, хотя действие обратимо через «Вернуть»',
          'Поведение отличается от меню в читалке',
        ]}
      >
        <PickerStates variant={PICKER_VARIANT.SELECT_RED} />
      </DemoSection>
      <DemoSection
        code="S2"
        title="Select, «Убрать» серым за чертой"
        description="То же, но «Убрать из закладок» приглушённым серым: обратимое действие без тона опасности."
        pros={['Тон честный: удаление обратимо', 'Список спокойнее']}
        cons={['Серый пункт похож на неактивный', 'Поведение отличается от меню в читалке']}
      >
        <PickerStates variant={PICKER_VARIANT.SELECT_GRAY} />
      </DemoSection>
      <DemoSection
        code="S3"
        title="Кнопка с меню, как в читалке"
        description="Кнопка «В закладки» / название папки и меню с теми же пунктами, что в читалке: папки с галочкой у текущей, за чертой — «Убрать из закладок» красным."
        pros={[
          'Одно поведение и одни пункты в двух местах — один компонент в features/bookmark',
          'Меню — привычное место для действия «Убрать»',
        ]}
        cons={[
          'Отходит от Select из плана — значение читается хуже, чем в поле',
          'Рядом кнопка «Продолжить» — две кнопки подряд',
        ]}
      >
        <PickerStates variant={PICKER_VARIANT.MENU} />
      </DemoSection>
      <DemoSection
        code="S4"
        title="Выбранный пункт в цвете папки"
        description="Как S1, но подложка, рамка, текст и галочка выбранного пункта — цветом папки вместо терракоты: «Читаю» синий, «Любимое» розовое. Иконки у всех контурные, своим цветом; в поле — иконка и название цветом папки."
        pros={[
          'На выбранном пункте один цвет — цвет папки',
          'Выглядит как обычный Select, просто в другом цвете',
        ]}
        cons={['Отходит от общего вида выбранного пункта — в остальных списках он терракотовый']}
      >
        <PickerStates variant={PICKER_VARIANT.SELECT_FOLDER_TINT} />
      </DemoSection>
      <DemoSection
        code="S5"
        title="Без подложки у выбранного"
        description="Выбранный пункт отмечен только галочкой и залитой иконкой, как в обычном меню; подложки и рамки нет."
        pros={['Цвету папки не с чем столкнуться', 'Самый спокойный список']}
        cons={['Выбор заметен слабее, чем в остальных списках приложения']}
      >
        <PickerStates variant={PICKER_VARIANT.SELECT_PLAIN} />
      </DemoSection>
      <DemoSection
        code="S6"
        title="Список без цвета"
        description="В списке иконки серые, у выбранного — акцентные вместе с текстом (как M1a). Цвет папки — только в поле, во вкладках и на метках."
        pros={['Выбранный пункт — ровно стандартный пункт проекта, ничего не спорит']}
        cons={['В списке не видно цветов папок — выбираешь по форме иконки и названию']}
      >
        <PickerStates variant={PICKER_VARIANT.SELECT_MONO} />
      </DemoSection>
      <DemoSection
        code="S7"
        title="Поле в цвете папки"
        description="Само поле — с лёгкой подложкой и рамкой цвета папки, иконка и название тем же цветом, как цветная кнопка статуса на MangaLib. Список — как в S4. Пустое «В закладки» — обычное серое поле."
        pros={[
          'Статус читается с первого взгляда — в закладках и в какой папке',
          'Сильный контраст между «есть» и «нет»',
        ]}
        cons={['Самый яркий элемент под обложкой — второе цветное пятно рядом с «Продолжить»']}
      >
        <PickerStates variant={PICKER_VARIANT.SELECT_FOLDER_FIELD} />
      </DemoSection>

      <AxisHeading
        letter="R"
        title="Кнопка в читалке"
        description="В панели читалки рядом со счётчиком страниц. Тап открывает меню: папки и «Убрать из закладок» — тот же набор, что S3. Меню живое."
      />
      <DemoSection
        code="R0"
        title="Как сейчас"
        description="Контурная закладка без действия."
        cons={['Ничего не делает', 'Не говорит, в закладках ли тайтл']}
      >
        <ReaderStates variant={READER_VARIANT.CURRENT} />
      </DemoSection>
      <DemoSection
        code="R1"
        title="Нейтральная, залита в закладках"
        description="Серая, как соседние кнопки панели; в закладках — залитая."
        pros={[
          'Не отвлекает от чтения — панель остаётся монохромной',
          'Состояние всё равно видно по заливке',
        ]}
        cons={['Какая папка — только в меню']}
      >
        <ReaderStates variant={READER_VARIANT.NEUTRAL} />
      </DemoSection>
      <DemoSection
        code="R2"
        title="Залита цветом папки"
        description="В закладках — залитая цветом своей папки."
        pros={['Видно и что в закладках, и где — тем же цветом, что на странице тайтла']}
        cons={[
          'Цветное пятно в панели читалки, которая сейчас целиком серая',
          'Серое «Брошено» не отличить от R1',
        ]}
      >
        <ReaderStates variant={READER_VARIANT.FOLDER_COLOR} />
      </DemoSection>
      <DemoSection
        code="R2a"
        title="Контурная в цвете папки"
        description="Как R2, но без заливки: в закладках — та же контурная закладка, только цветом папки. Как иконки папок везде."
        pros={['Контурная, как все иконки приложения', 'Цвет говорит, в какой папке']}
        cons={['Серое «Брошено» не отличить от «не в закладках»']}
      >
        <ReaderStates variant={READER_VARIANT.FOLDER_OUTLINE} />
      </DemoSection>
      <DemoSection
        code="R2c"
        title="Иконка папки в её цвете"
        description="В закладках вместо закладки — контурная иконка самой папки (книга, часы…) её цветом; не в закладках — серая закладка."
        pros={[
          'Видно, в какой папке, и по цвету, и по форме',
          '«Брошено» отличается от «не в закладках» формой',
        ]}
        cons={['Кнопка меняет форму — в панели читалки её ищут по закладке']}
      >
        <ReaderStates variant={READER_VARIANT.FOLDER_GLYPH} />
      </DemoSection>
      <DemoSection
        code="R3"
        title="Залита акцентом"
        description="В закладках — залитая терракотой, независимо от папки."
        pros={['Однозначно «в закладках»', 'Акцент в читалке уже значит «моё» — прогресс, отметка']}
        cons={['Терракота — цвет действий: заливка читается как «нажми»', 'Папку не видно']}
      >
        <ReaderStates variant={READER_VARIANT.ACCENT} />
      </DemoSection>
    </Stack>
  );
}

export default TitleSection;
