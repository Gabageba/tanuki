import { ActionIcon, Box, Checkbox, Group } from '@mantine/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVerticalIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { HomeSectionInfo } from '@tanuki/contracts';
import styles from '../../Settings.module.scss';

type Props = {
  section: HomeSectionInfo;
  isOn: boolean;
  disabled: boolean;
  onChange: (isOn: boolean) => void;
};

/** Блок источника во вкладке «Подборки»: ручка перетаскивания и галочка. Порядок — тот же, что у
 *  вкладок блоков на странице подборок. */
function SelectionsSectionItem({ section, isOn, disabled, onChange }: Props) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    disabled,
  });

  return (
    <Box
      ref={setNodeRef}
      className={styles.sortableRow}
      mod={{ dragging: isDragging }}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <Group gap="xs" wrap="nowrap">
        <ActionIcon
          variant="subtle"
          color="gray"
          size="xs"
          className={styles.dragHandle}
          disabled={disabled}
          aria-label={t('changeOrder')}
          {...attributes}
          {...listeners}
        >
          <DotsSixVerticalIcon />
        </ActionIcon>
        <Checkbox
          size="xs"
          label={section.title}
          disabled={disabled}
          checked={isOn}
          onChange={(event) => onChange(event.currentTarget.checked)}
        />
      </Group>
    </Box>
  );
}

export default SelectionsSectionItem;
