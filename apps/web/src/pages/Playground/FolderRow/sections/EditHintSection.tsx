import { Stack } from '@mantine/core';
import DemoSection from '../../components/DemoSection';
import AxisHeading from '../../Notifications/components/AxisHeading';
import EditableFoldersMock from '../components/EditableFoldersMock';
import VariantStates from '../components/VariantStates';
import { DELETE_PLACE, EDIT_HINT } from '../models';

/** Ось E — как показать, что своя папка открывается и правится (развитие V2). */
function EditHintSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="E"
        title="Как понять, что папка правится"
        description="Развитие V2: меню нет, справа у всех только тумблер, своя папка открывается кликом по строке. Чем подсказать, что строка открывается. Удаление здесь — D2, отдельной зоной под «Сохранить»."
      />
      <DemoSection
        code="E1"
        title="Карандаш при наведении"
        description="Когда курсор на строке своей папки, за названием появляется карандаш, а строка подсвечивается. На телефоне наведения нет — карандаш виден всегда."
        pros={['Прямо называет действие', 'Строки той же высоты, что сейчас']}
        cons={[
          'На десктопе подсказку видно, только когда курсор уже на строке',
          'На телефоне это почти V3 — карандаш у каждой строки в своём месте',
        ]}
      >
        <VariantStates
          render={(folders) => (
            <EditableFoldersMock
              folders={folders}
              hint={EDIT_HINT.HOVER_PENCIL}
              deletion={DELETE_PLACE.ZONE}
            />
          )}
        />
      </DemoSection>
      <DemoSection
        code="E2"
        title="Подпись под названием"
        description="У своих под названием приглушённое «Изменить» с карандашом — подчёркивается при наведении на строку; у встроенных — «Встроенная». Клик по строке открывает модалку."
        pros={[
          'Разница между своими и встроенными видна сразу, и на телефоне тоже',
          'Строки симметричны: подпись есть у всех',
        ]}
        cons={['Строки в две строчки — список выше', '«Встроенная» повторяется четыре раза']}
      >
        <VariantStates
          render={(folders) => (
            <EditableFoldersMock
              folders={folders}
              hint={EDIT_HINT.CAPTION}
              deletion={DELETE_PLACE.ZONE}
            />
          )}
        />
      </DemoSection>
      <DemoSection
        code="E3"
        title="Раскрытие на месте"
        description="За названием своей папки — каретка ▸. Клик по строке раскрывает под ней редактор: название, цвет и иконка, «Сохранить»; тумблер слежения уже в строке. «Любимое» раскрыто сразу."
        pros={['Каретка — знакомый знак «раскрывается»', 'Правка не уводит из списка, без модалки']}
        cons={[
          'Раскрытый редактор раздвигает список и мешает перетаскиванию',
          'Каретка, как и карандаш, стоит у каждой строки в своём месте',
        ]}
      >
        <VariantStates
          render={(folders) => (
            <EditableFoldersMock
              folders={folders}
              hint={EDIT_HINT.EXPAND}
              deletion={DELETE_PLACE.ZONE}
              initialExpandedId="favorites"
            />
          )}
        />
      </DemoSection>
    </Stack>
  );
}

export default EditHintSection;
