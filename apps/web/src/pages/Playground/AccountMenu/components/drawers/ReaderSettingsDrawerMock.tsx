import { SegmentedControl, Stack, Text } from '@mantine/core';
import { SlidersHorizontalIcon } from '@phosphor-icons/react';
import DrawerPanel from '../DrawerPanel';
import DrawerHeading from '../DrawerHeading';
import HeadingIcon from '../HeadingIcon';
import { HEADER_STYLE, type HeaderStyle } from '../../models';

type Props = {
  headerStyle: HeaderStyle;
};

function ReaderSettingsDrawerMock({ headerStyle }: Props) {
  return (
    <DrawerPanel
      title={
        headerStyle === HEADER_STYLE.UNIFORM ? (
          <DrawerHeading
            icon={
              <HeadingIcon>
                <SlidersHorizontalIcon size={20} />
              </HeadingIcon>
            }
            title="Настройки читалки"
            subtitle="Ван-Пис"
          />
        ) : (
          'Настройки читалки'
        )
      }
    >
      <Stack gap={6}>
        <Text fz="sm" fw={500}>
          Режим чтения
        </Text>
        <SegmentedControl fullWidth data={['Вертикальный', 'Горизонтальный']} />
      </Stack>
    </DrawerPanel>
  );
}

export default ReaderSettingsDrawerMock;
