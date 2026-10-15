import { DELETE_PLACE, ROW_VARIANT, type DeletePlace, type RowVariant } from './models';

/** Подпись блока, заголовок и пояснение его шапки — под то, что умеют строки этого вида. */
export const getBlockTexts = (variant: RowVariant) => {
  switch (variant) {
    case ROW_VARIANT.CURRENT:
    case ROW_VARIANT.CURRENT_COMPACT:
    case ROW_VARIANT.SWITCH_LEFT:
    case ROW_VARIANT.PENCIL:
      return {
        label: 'Папки',
        title: 'Порядок и обновления',
        description:
          'Перетащите папку, чтобы поменять порядок вкладок. Тумблер — следить за обновлениями: проверять новые главы и отмечать карточку точкой.',
      };
    case ROW_VARIANT.ROW_CLICK:
      return {
        label: 'Папки',
        title: 'Порядок и обновления',
        description:
          'Перетащите папку, чтобы поменять порядок вкладок. Тумблер — следить за обновлениями: проверять новые главы и отмечать карточку точкой. Свою папку можно открыть и изменить.',
      };
    case ROW_VARIANT.ORDER:
      return {
        label: 'Папки',
        title: 'Порядок вкладок',
        description: 'Перетащите папку, чтобы поменять порядок вкладок в закладках.',
      };
    case ROW_VARIANT.TRACKING:
      return {
        label: 'Обновления',
        title: 'Следить за обновлениями',
        description: 'Проверять новые главы и отмечать карточку точкой.',
      };
  }
};

const ORDER_AND_TRACKING =
  'Перетащите папку, чтобы поменять порядок вкладок. Тумблер — следить за обновлениями: проверять новые главы и отмечать карточку точкой.';

/** Пояснение шапки для строк без меню (оси E и D): как удалить свою папку, если это не видно. */
export const getEditableHeaderDescription = (
  deletion: DeletePlace,
  isEditMode: boolean,
  hasCustom: boolean,
) => {
  if (isEditMode) return 'Встроенные папки удалить нельзя. Тайтлы из удалённой можно перенести.';
  switch (deletion) {
    case DELETE_PLACE.DROP_ZONE:
      return hasCustom
        ? `${ORDER_AND_TRACKING} Чтобы удалить свою папку, перетащите её вниз списка.`
        : ORDER_AND_TRACKING;
    case DELETE_PLACE.EDIT_MODE:
    case DELETE_PLACE.ZONE:
      return ORDER_AND_TRACKING;
  }
};
