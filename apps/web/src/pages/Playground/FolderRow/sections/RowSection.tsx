import { Stack } from '@mantine/core';
import DemoSection from '../../components/DemoSection';
import AxisHeading from '../../Notifications/components/AxisHeading';
import FolderSettingsMock from '../components/FolderSettingsMock';
import VariantStates from '../components/VariantStates';
import { ROW_VARIANT } from '../models';

/** Раздел V — устройство строки целиком: как сейчас, тумблер слева, без меню, два блока. */
function RowSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="V"
        title="Устройство строки"
        description="Первый круг: куда деть тумблер и меню, чтобы у встроенных не было дыры справа, а тумблеры не вставали вразнобой."
      />
      <DemoSection
        code="V0"
        title="Как сейчас"
        description="Тумблер, за ним меню «⋯» у своих; у встроенных на месте меню пустое место той же ширины."
        pros={['Тумблеры колонкой', 'Меню у правого края, как везде']}
        cons={[
          'У встроенных тумблер висит с дырой справа',
          'В списке из одних встроенных дыра у каждой строки, и её нечем объяснить',
        ]}
      >
        <VariantStates
          render={(folders) => (
            <FolderSettingsMock folders={folders} blocks={[ROW_VARIANT.CURRENT]} />
          )}
        />
      </DemoSection>
      <DemoSection
        code="V1"
        title="Тумблер слева"
        description="Тумблер сразу за ручкой, перед иконкой — как чекбокс в списке. Справа только «⋯» своих папок, у самого края."
        pros={[
          'Тумблеры колонкой при любом наборе папок',
          'Справа у встроенных — край строки, а не пустое место рядом с контролом',
        ]}
        cons={[
          'В остальных настройках тумблер справа — здесь он один такой',
          'Слева три элемента подряд: ручка, тумблер, иконка',
        ]}
      >
        <VariantStates
          render={(folders) => (
            <FolderSettingsMock folders={folders} blocks={[ROW_VARIANT.SWITCH_LEFT]} />
          )}
        />
      </DemoSection>
      <DemoSection
        code="V2"
        title="Без меню, клик по строке"
        description="Справа у всех только тумблер. Строка своей папки подсвечивается при наведении и открывает «Изменить папку» — там же «Удалить папку». Встроенные не кликаются."
        pros={['Правая колонка одинаковая у всех строк', 'Меньше мелких контролов в строке']}
        cons={[
          'Не видно, что строка открывается, — особенно на телефоне, где нет наведения',
          'Клик по строке соседствует с перетаскиванием',
          'Удаление — на втором шаге, рядом с «Сохранить»',
        ]}
      >
        <VariantStates
          render={(folders) => (
            <FolderSettingsMock folders={folders} blocks={[ROW_VARIANT.ROW_CLICK]} />
          )}
        />
      </DemoSection>
      <DemoSection
        code="V3"
        title="Карандаш за названием"
        description="Справа у всех только тумблер. У своей папки сразу за названием — карандаш, он открывает «Изменить папку» с «Удалить папку» внутри."
        pros={['Правая колонка одинаковая у всех строк', 'Действие видно, в отличие от V2']}
        cons={[
          'Карандаш стоит там, где кончилось название, — у каждой строки в своём месте',
          'Удаление — на втором шаге',
        ]}
      >
        <VariantStates
          render={(folders) => (
            <FolderSettingsMock folders={folders} blocks={[ROW_VARIANT.PENCIL]} />
          )}
        />
      </DemoSection>
      <DemoSection
        code="V4"
        title="Два блока"
        description="«Порядок вкладок»: ручка, иконка, название, «⋯» своих. «Следить за обновлениями»: иконка, название, тумблер у всех. Тумблер и меню нигде не стоят рядом."
        pros={[
          'В каждом блоке правая колонка своя и ровная',
          'Каждый блок объясняет себя заголовком — «Тумблер — …» в пояснении не нужно',
        ]}
        cons={[
          'Папки перечислены дважды — вдвое длиннее, особенно на телефоне',
          'Новый порядок во втором блоке виден только после перетаскивания в первом',
        ]}
      >
        <VariantStates
          render={(folders) => (
            <FolderSettingsMock
              folders={folders}
              blocks={[ROW_VARIANT.ORDER, ROW_VARIANT.TRACKING]}
            />
          )}
        />
      </DemoSection>
    </Stack>
  );
}

export default RowSection;
