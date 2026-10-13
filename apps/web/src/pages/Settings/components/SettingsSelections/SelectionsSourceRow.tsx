import { Checkbox, Stack, Switch, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Source } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import GroupedList from '@/shared/ui/GroupedList';

type Props = {
  source: Source;
  isSourceOn: boolean;
  isSectionOn: (sectionId: string) => boolean;
  onSourceChange: (isOn: boolean) => void;
  onSectionChange: (sectionId: string, isOn: boolean) => void;
};

/**
 * Строка источника (T1a): как во вкладке «Источники», только без ручки перетаскивания — порядок
 * меняют там. Переключатель «Показывать в подборках», под ним галочки блоков одной колонкой.
 * Выключен источник — галочки гаснут, но выбор в них сохраняется.
 */
function SelectionsSourceRow({
  source,
  isSourceOn,
  isSectionOn,
  onSourceChange,
  onSectionChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <GroupedList.Row
      icon={<SourceIcon id={source.id} title={source.title} size={32} />}
      title={
        <Text fz={14} lh="tight" truncate>
          {source.title}
        </Text>
      }
      description={
        <Text fz={12} lh="tight" c="dimmed" ff="monospace" truncate>
          {source.domain}
        </Text>
      }
      action={
        <Switch
          checked={isSourceOn}
          onChange={(event) => onSourceChange(event.currentTarget.checked)}
          aria-label={t('showSourceInSelections', { source: source.title })}
        />
      }
    >
      <Stack gap={8}>
        {source.homeSections.map((section) => (
          <Checkbox
            key={section.id}
            size="xs"
            label={section.title}
            disabled={!isSourceOn}
            checked={isSectionOn(section.id)}
            onChange={(event) => onSectionChange(section.id, event.currentTarget.checked)}
          />
        ))}
      </Stack>
    </GroupedList.Row>
  );
}

export default SelectionsSourceRow;
