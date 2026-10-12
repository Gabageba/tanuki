import { Stack, Text } from '@mantine/core';
import { MOCK_PAGE } from '../models';
import FooterMock from './FooterMock';

type Props = {
  withHome: boolean;
};

/** Нижняя панель в двух состояниях — на главной и в каталоге. */
function FooterStates({ withHome }: Props) {
  return (
    <Stack gap="sm">
      <Text fz={12} c="dimmed" ff="monospace">
        /
      </Text>
      <FooterMock withHome={withHome} page={MOCK_PAGE.HOME} />
      <Text fz={12} c="dimmed" ff="monospace">
        /catalog/remanga
      </Text>
      <FooterMock withHome={withHome} page={MOCK_PAGE.CATALOG} />
    </Stack>
  );
}

export default FooterStates;
