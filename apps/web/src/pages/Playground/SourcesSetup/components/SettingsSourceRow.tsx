import { Group, Switch, Text } from '@mantine/core';
import { DotsSixVerticalIcon } from '@phosphor-icons/react';
import SourceIcon from '@/entities/source/components/SourceIcon';
import GroupedList from '@/shared/ui/GroupedList';
import MidDot from '@/shared/ui/MidDot';
import { getLoginMark } from '../lib';
import { MARK_PLACEMENT, type DemoSource, type MarkPlacement } from '../models';
import LoginMarkView from './LoginMarkView';

type Props = {
  source: DemoSource;
  placement: MarkPlacement;
};

/** Строка плоского списка настроек: ручка перетаскивания, источник, пометка о входе, выключатель. */
function SettingsSourceRow({ source, placement }: Props) {
  const mark = getLoginMark(source);
  const getMark = (at: MarkPlacement) =>
    mark && placement === at && <LoginMarkView mark={mark} placement={placement} />;

  return (
    <GroupedList.Row
      icon={
        <Group gap="xs" wrap="nowrap">
          <DotsSixVerticalIcon size={16} style={{ cursor: 'grab' }} />
          <SourceIcon id={source.id} title={source.title} size={32} />
        </Group>
      }
      title={
        <Group gap="xs" wrap="nowrap">
          <Text fz={14} lh={1} truncate>
            {source.title}
          </Text>
          {getMark(MARK_PLACEMENT.TITLE)}
        </Group>
      }
      description={
        <Group gap={6} wrap="nowrap">
          <Text fz={12} c="dimmed" ff="monospace" truncate>
            {source.domain}
          </Text>
          {mark && placement === MARK_PLACEMENT.DESCRIPTION && <MidDot />}
          {getMark(MARK_PLACEMENT.DESCRIPTION)}
        </Group>
      }
      action={
        <Group gap="xs" wrap="nowrap">
          {getMark(MARK_PLACEMENT.ACTION)}
          <Switch defaultChecked={source.isEnabled} aria-label={source.title} />
        </Group>
      }
    />
  );
}

export default SettingsSourceRow;
