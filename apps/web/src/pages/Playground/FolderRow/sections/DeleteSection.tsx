import { Stack } from '@mantine/core';
import DemoSection from '../../components/DemoSection';
import AxisHeading from '../../Notifications/components/AxisHeading';
import EditableFoldersMock from '../components/EditableFoldersMock';
import VariantStates from '../components/VariantStates';
import { DELETE_PLACE, EDIT_HINT } from '../models';

/** Ось D — где удаляется своя папка, если меню у строки нет. */
function DeleteSection() {
  return (
    <Stack gap="xl">
      <AxisHeading
        letter="D"
        title="Где удалять папку"
        description="Меню нет, поэтому удалению нужно своё место — не рядом с «Сохранить». Подсказка, что папка правится, во всех трёх — E1 (карандаш при наведении)."
      />
      <DemoSection
        code="D1"
        title="Режим «Изменить список»"
        description="В подвале рядом с «Новая папка» — «Изменить список». В этом режиме тумблеры своих папок меняются на красные корзины, встроенные приглушены и без тумблера; «Готово» возвращает обычный вид. В модалке папки удаления нет."
        pros={[
          'Удаление отдельно от правки и всё в одном месте',
          'Привычно: так устроены списки в iOS',
        ]}
        cons={[
          'Лишний режим ради одного действия',
          'В режиме у встроенных справа снова пусто — хоть приглушённость это и объясняет',
        ]}
      >
        <VariantStates
          render={(folders) => (
            <EditableFoldersMock
              folders={folders}
              hint={EDIT_HINT.HOVER_PENCIL}
              deletion={DELETE_PLACE.EDIT_MODE}
            />
          )}
        />
      </DemoSection>
      <DemoSection
        code="D2"
        title="Отдельная зона в модалке"
        description="В «Изменить папку» под «Сохранить» — разделитель, что будет с тайтлами, и «Удалить папку». Правка и удаление в одном окне, но не в одном ряду."
        pros={[
          'Без нового режима — удаление рядом с самой папкой',
          'Опасная кнопка не соседствует с «Сохранить»',
        ]}
        cons={['Всё ещё внутри правки — открыл переименовать, видишь удаление']}
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
        code="D3"
        title="Перетащить в корзину"
        description="Пока своя папка тащится за ручку, подвал списка превращается в зону «Отпустите здесь, чтобы удалить папку». Шапка списка подсказывает это одной фразой. Встроенные зону не открывают."
        pros={[
          'Ни одной лишней кнопки ни в строке, ни в модалке',
          'Работает тем же жестом, что и порядок',
        ]}
        cons={[
          'Скрыто: без фразы в шапке не найти',
          'На телефоне тащить до низа длинного списка неудобно',
        ]}
      >
        <VariantStates
          render={(folders) => (
            <EditableFoldersMock
              folders={folders}
              hint={EDIT_HINT.HOVER_PENCIL}
              deletion={DELETE_PLACE.DROP_ZONE}
            />
          )}
        />
      </DemoSection>
    </Stack>
  );
}

export default DeleteSection;
