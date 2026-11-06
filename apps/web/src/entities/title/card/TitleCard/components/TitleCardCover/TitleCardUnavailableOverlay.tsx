import { Overlay, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { BOOKMARK_AVAILABILITY, VIEW_MODE, type BookmarkAvailability } from '@tanuki/contracts';
import useTitleCardLayout from '../../hooks/useTitleCardLayout';
import { getTitleCardAvailabilityLabel, getTitleCardAvailabilityIcon } from './availability';

type Props = { availability?: BookmarkAvailability };

function TitleCardUnavailableOverlay({ availability }: Props) {
  const { t } = useTranslation();
  const { viewMode } = useTitleCardLayout();
  const compact = viewMode === VIEW_MODE.LIST;
  if (availability == null || availability === BOOKMARK_AVAILABILITY.AVAILABLE) return null;

  return (
    <Overlay
      center
      color="var(--mantine-color-body)"
      backgroundOpacity={0.85}
      zIndex={0}
      c="dimmed"
      p={compact ? 4 : 'sm'}
    >
      <Stack gap={compact ? 2 : 6} align="center">
        {getTitleCardAvailabilityIcon(availability, compact ? 20 : 32)}
        <Text fz="xs" ta="center" lh="tight" c="inherit">
          {getTitleCardAvailabilityLabel(availability, t)}
        </Text>
      </Stack>
    </Overlay>
  );
}

export default TitleCardUnavailableOverlay;
