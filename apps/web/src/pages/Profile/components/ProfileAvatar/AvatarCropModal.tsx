import { Box, Button, Group, Slider, Stack, Text } from '@mantine/core';
import { CropIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { useTranslation } from 'react-i18next';
import { MAX_ZOOM } from './models';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import styles from './ProfileAvatar.module.scss';

type Props = {
  src: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (area: Area) => void;
};

function AvatarCropModal({ src, isSaving, onClose, onSave }: Props) {
  const { t } = useTranslation();
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);

  const reset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(null);
  };

  return (
    <ToneModal
      tone={MODAL_TONE.NEUTRAL}
      icon={CropIcon}
      opened={src !== null}
      onClose={onClose}
      onExitTransitionEnd={reset}
      title={t('newAvatar')}
    >
      <Stack>
        <Box pos="relative" h={320} bg="black" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              maxZoom={MAX_ZOOM}
              aspect={1}
              showGrid={false}
              classes={{ cropAreaClassName: styles.cropArea }}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, croppedAreaPixels) => setArea(croppedAreaPixels)}
            />
          )}
        </Box>
        <Group gap="sm" wrap="nowrap">
          <Text c="dimmed" lh={0}>
            <MagnifyingGlassMinusIcon />
          </Text>
          <Slider
            flex={1}
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={setZoom}
            label={null}
            aria-label={t('scale')}
          />
          <Text c="dimmed" lh={0}>
            <MagnifyingGlassPlusIcon />
          </Text>
        </Group>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose} disabled={isSaving}>
            {t('cancel')}
          </Button>
          <Button onClick={() => area && onSave(area)} loading={isSaving} disabled={!area}>
            {t('save')}
          </Button>
        </Group>
      </Stack>
    </ToneModal>
  );
}

export default AvatarCropModal;
