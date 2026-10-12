import { Divider, Group, Stack, Title } from '@mantine/core';
import GoBackButton from '@/shared/ui/GoBackButton';
import { MOCK_HOME_ALL } from '../mocks';
import { SOURCE_PICKER } from '../models';
import OneSourceSelections from './OneSourceSelections';

type Props = {
  /** С какого источника открыть — с того, чью карточку нажали. */
  initialId?: string;
};

/** P4a/P4b — отдельная страница «Подборки»: «Назад» на главную, чипы источников, блоки выбранного. */
function DiscoverPageMock({ initialId }: Props) {
  return (
    <Stack gap="lg">
      <Stack gap="md">
        <Group gap="xs" wrap="nowrap">
          <GoBackButton path="/" />
          <Title order={2}>Подборки</Title>
        </Group>
        <Divider />
      </Stack>
      <OneSourceSelections
        homes={MOCK_HOME_ALL}
        picker={SOURCE_PICKER.CHIPS}
        initialId={initialId}
      />
    </Stack>
  );
}

export default DiscoverPageMock;
