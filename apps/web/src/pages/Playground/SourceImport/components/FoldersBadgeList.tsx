import { Fragment } from 'react';
import { Badge, Divider, Group, Paper, Stack, Text } from '@mantine/core';
import { ArrowRightIcon } from '@phosphor-icons/react';
import type { FolderSelection } from '../hooks/useFolderSelection';
import { countFresh } from '../lib';
import { FOLDER_MAPPING, type SiteFolder } from '../models';
import FolderBadge from './FolderBadge';
import FolderCount from './FolderCount';
import SiteFolderCheckbox from './SiteFolderCheckbox';

type Props = {
  folders: SiteFolder[];
  selection: FolderSelection;
};

/** F2 — «откуда → куда»: слева папка сайта и счётчик, справа бейдж нашей папки. */
function FoldersBadgeList({ folders, selection }: Props) {
  return (
    <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
      {folders.map((folder, index) => (
        <Fragment key={folder.id}>
          {index > 0 && <Divider />}
          <Group
            px="md"
            py="xs"
            gap="sm"
            wrap="nowrap"
            opacity={countFresh(folder) === 0 ? 0.5 : undefined}
          >
            <SiteFolderCheckbox folder={folder} selection={selection} />
            <Stack gap={2} flex={1} miw={0}>
              <Text fz="sm" lh="tight" style={{ overflowWrap: 'anywhere' }}>
                {folder.name}
              </Text>
              <FolderCount folder={folder} />
            </Stack>
            <Group gap={4} flex="none" wrap="nowrap" maw="45%">
              <ArrowRightIcon size={12} color="var(--mantine-color-dimmed)" />
              <Stack gap={2} align="flex-end" miw={0}>
                <FolderBadge folder={folder.target} />
                {folder.mapping === FOLDER_MAPPING.CREATED && (
                  <Badge variant="muted" color="gray" size="xs">
                    новая
                  </Badge>
                )}
              </Stack>
            </Group>
          </Group>
        </Fragment>
      ))}
    </Paper>
  );
}

export default FoldersBadgeList;
