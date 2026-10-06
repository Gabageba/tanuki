import { Badge, Divider, Group, Stack, Text } from '@mantine/core';
import { SOURCE_ID } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import DrawerField from '@/shared/ui/DrawerField';
import DrawerPanel from '../DrawerPanel';
import DrawerHeading from '../DrawerHeading';
import { HEADER_STYLE, type HeaderStyle } from '../../models';

type Props = {
  headerStyle: HeaderStyle;
};

const TITLE = 'MangaLib';
const DOMAIN = 'mangalib.me';

function SourceDrawerMock({ headerStyle }: Props) {
  const fields = (
    <Stack gap="sm">
      <DrawerField label="Статус">
        <Badge variant="muted" color="teal">
          Работает
        </Badge>
      </DrawerField>
      <DrawerField label="Проверен">
        <Text fz="sm">5 минут назад</Text>
      </DrawerField>
    </Stack>
  );

  if (headerStyle === HEADER_STYLE.TEXT) {
    return (
      <DrawerPanel title="Источник">
        <Stack gap="md">
          <Group gap="sm" wrap="nowrap">
            <SourceIcon id={SOURCE_ID.MANGALIB} title={TITLE} size={48} />
            <Stack gap={0} miw={0}>
              <Text fw={600} truncate>
                {TITLE}
              </Text>
              <Text fz="sm" c="dimmed" ff="monospace" truncate>
                {DOMAIN}
              </Text>
            </Stack>
          </Group>
          <Divider />
          {fields}
        </Stack>
      </DrawerPanel>
    );
  }

  return (
    <DrawerPanel
      title={
        <DrawerHeading
          icon={<SourceIcon id={SOURCE_ID.MANGALIB} title={TITLE} size={40} />}
          title={TITLE}
          subtitle={DOMAIN}
          isSubtitleMonospace
        />
      }
    >
      {fields}
    </DrawerPanel>
  );
}

export default SourceDrawerMock;
