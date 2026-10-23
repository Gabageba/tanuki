import { Badge, Checkbox, Group, Stack, Text } from '@mantine/core';
import { getItemNote, isImported } from '../lib';
import {
  IMPORTED_VIEW,
  MAPPING_VIEW,
  ROW_VIEW,
  type ImportItem,
  type TargetFolder,
  type TitlesConfig,
} from '../models';
import ChapterMeta from './ChapterMeta';
import FolderBadge from './FolderBadge';
import MiniCover from './MiniCover';

type Props = {
  item: ImportItem;
  target: TargetFolder;
  config: TitlesConfig;
  checked: boolean;
  onToggle: () => void;
};

/** Тайтл в списке импорта: чекбокс во всю строку, название, куда ляжет, где остановился, и что
 *  будет, если он у вас уже есть. Раскладку задаёт ось R, бейдж папки — M, подачу уже
 *  импортированных — A, расхождение отметки — P. */
function TitleRow({ item, target, config, checked, onToggle }: Props) {
  const isDone = isImported(item);
  const isBadgeMark = isDone && config.imported === IMPORTED_VIEW.BADGE;
  const note = isBadgeMark ? null : getItemNote(item);
  const badge = config.mapping === MAPPING_VIEW.ROW_BADGE && <FolderBadge folder={target} />;
  const chapter = <ChapterMeta item={item} progress={config.progress} />;
  const doneBadge = isBadgeMark && (
    <Badge variant="muted" color="gray" size="sm" flex="none">
      Уже есть
    </Badge>
  );

  const name = (
    <Text
      fz="sm"
      lh="tight"
      c={isDone && !isBadgeMark ? 'dimmed' : undefined}
      truncate={config.row === ROW_VIEW.ONE_LINE}
      flex={config.row === ROW_VIEW.ONE_LINE ? 1 : undefined}
      miw={0}
      style={{ overflowWrap: 'anywhere' }}
    >
      {item.name}
    </Text>
  );

  const noteText = note && (
    <Text fz={12} c="dimmed" lh="tight">
      {note}
    </Text>
  );

  const content =
    config.row === ROW_VIEW.ONE_LINE ? (
      <Stack gap={2} flex={1} miw={0}>
        <Group gap="xs" wrap="nowrap" justify="space-between">
          {name}
          <Group gap="xs" wrap="nowrap" flex="none">
            {chapter}
            {doneBadge}
            {badge}
          </Group>
        </Group>
        {noteText}
      </Stack>
    ) : (
      <Group gap="sm" wrap="nowrap" flex={1} miw={0} align="flex-start">
        {config.row === ROW_VIEW.COVER && <MiniCover hue={item.hue} />}
        <Stack gap={4} flex={1} miw={0}>
          {name}
          {(badge || doneBadge || item.lastChapter !== null) && (
            <Group gap="xs" wrap="wrap">
              {doneBadge}
              {badge}
              {chapter}
            </Group>
          )}
          {noteText}
        </Stack>
      </Group>
    );

  return (
    <Checkbox.Card
      checked={checked}
      onClick={onToggle}
      withBorder={false}
      radius={0}
      px="md"
      py="xs"
    >
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <Checkbox.Indicator mt={2} />
        {content}
      </Group>
    </Checkbox.Card>
  );
}

export default TitleRow;
