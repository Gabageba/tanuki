import { Switch, Text } from '@mantine/core';
import type { Source } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import GroupedList from '@/shared/ui/GroupedList';
import useToggleSource from './hooks/useToggleSource';
import styles from './SettingsSources.module.scss';

type Props = {
  source: Source;
};

function SourceToggleRow({ source }: Props) {
  const toggleSource = useToggleSource();

  return (
    <GroupedList.Row
      icon={<SourceIcon id={source.id} title={source.title} size={32} />}
      title={source.title}
      description={
        <Text fz={12} c="dimmed" ff="monospace" truncate>
          {source.domain}
        </Text>
      }
      action={
        <Switch
          checked={source.isEnabled}
          onChange={(event) =>
            toggleSource.mutate({ sourceId: source.id, isEnabled: event.currentTarget.checked })
          }
          aria-label={source.title}
          classNames={{ track: styles.switchTrack }}
        />
      }
    />
  );
}

export default SourceToggleRow;
