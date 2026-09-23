import { Box, Center, Flex, Portal, Text } from '@mantine/core';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

type Props = {
  tapZoneWidth: number;
  visible: boolean;
};

// Ниже шапки AppShell (z-index 100) и drawer'а настроек (200) — подсказка не должна перекрывать
// ни то, ни другое.
const OVERLAY_Z_INDEX = 99;

const ICON_SIZE = 28;

// Подсветка ложится на страницы тайтла, то есть на произвольную картинку: цвета темы тут слишком
// бледные, поэтому берём те же переменные, но плотнее.
const SIDE_ZONE_BG = 'color-mix(in srgb, var(--mantine-primary-color-filled) 35%, transparent)';
const CENTER_ZONE_BG = 'color-mix(in srgb, var(--mantine-color-black) 45%, transparent)';

/**
 * Те же зоны, но в натуральную величину поверх читалки: по схеме в настройках видно пропорции, а
 * дотянется ли палец — только так. Показывается после закрытия drawer'а, когда экран свободен.
 *
 * Через Portal: у мобильной панели управления есть transform, а он делает её containing block'ом
 * для position: fixed — оверлей растянулся бы по панели, а не по экрану.
 */
function ReaderTapZonesOverlay({ tapZoneWidth, visible }: Props) {
  const { t } = useTranslation();

  return (
    <Portal>
      <Box
        pos="fixed"
        inset={0}
        // Скрим тёмный в обеих схемах — он поверх страниц, а не поверх фона приложения.
        c="var(--mantine-color-white)"
        style={{
          zIndex: OVERLAY_Z_INDEX,
          pointerEvents: 'none',
          opacity: visible ? 1 : 0,
          transition: 'opacity 200ms ease',
        }}
      >
        <Flex h="100%">
          <Center w={`${tapZoneWidth}%`} bg={SIDE_ZONE_BG}>
            <CaretLeftIcon size={ICON_SIZE} />
          </Center>
          <Center flex={1} bg={CENTER_ZONE_BG} miw={0}>
            <Text fz={12} truncate>
              {t('menu')}
            </Text>
          </Center>
          <Center w={`${tapZoneWidth}%`} bg={SIDE_ZONE_BG}>
            <CaretRightIcon size={ICON_SIZE} />
          </Center>
        </Flex>
      </Box>
    </Portal>
  );
}

export default ReaderTapZonesOverlay;
