import { Group, Stack, Text } from '@mantine/core';
import DemoSection from '../../components/DemoSection';
import type { VariantDemo } from '../models';
import NewChaptersPreview from './NewChaptersPreview';

type Props = { variant: VariantDemo };

function NewChapterComparison({ variant: { id, metaVariant, ...variant } }: Props) {
  return (
    <DemoSection {...variant}>
      <Group align="flex-start" gap="xl">
        <Stack w={820} maw="100%" miw={0} gap="xs">
          <Text fz="xs" c="dimmed">
            Десктоп · две колонки
          </Text>
          <NewChaptersPreview variant={id} metaVariant={metaVariant} />
        </Stack>
        <Stack w={360} maw="100%" miw={0} gap="xs">
          <Text fz="xs" c="dimmed">
            Телефон · 360 px
          </Text>
          <NewChaptersPreview variant={id} metaVariant={metaVariant} mobile />
        </Stack>
      </Group>
    </DemoSection>
  );
}

export default NewChapterComparison;
