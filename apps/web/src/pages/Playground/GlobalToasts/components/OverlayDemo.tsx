import { useState } from 'react';
import { Button, Drawer, Group, Stack, Text } from '@mantine/core';
import { FolderIcon, SidebarSimpleIcon } from '@phosphor-icons/react';
import ToneModal from '@/shared/ui/ToneModal';
import { MODAL_TONE } from '@/shared/ui/ToneModal/models';
import SandboxOnly from '../../components/SandboxOnly';
import { OVERLAY_KIND, type OverlayKind, type ToastAppearance } from '../models';
import useVisualViewport from '../hooks/useVisualViewport';
import OverlayContents from './OverlayContents';

type Props = {
  appearance?: Partial<ToastAppearance>;
  toastWidth?: number;
  modalLabel?: string;
  drawerLabel?: string;
};

function OverlayDemo({
  appearance,
  toastWidth = 360,
  modalLabel = 'Открыть модалку',
  drawerLabel = 'Открыть drawer',
}: Props) {
  const [kind, setKind] = useState<OverlayKind | null>(null);
  const viewport = useVisualViewport();
  const compact = viewport.width < 768 || viewport.height < 600;
  const close = () => setKind(null);
  const open = (value: OverlayKind) => setKind(value);
  return (
    <Stack gap="md">
      <SandboxOnly>
        <Stack gap="sm">
          <Group gap="xs">
            <Button leftSection={<FolderIcon />} onClick={() => open(OVERLAY_KIND.MODAL)}>
              {modalLabel}
            </Button>
            <Button
              variant="default"
              leftSection={<SidebarSimpleIcon />}
              onClick={() => open(OVERLAY_KIND.DRAWER)}
            >
              {drawerLabel}
            </Button>
          </Group>
          <Text fz="sm" c="dimmed">
            Тост находится внутри области фокуса оверлея. На узком или низком экране форма получает
            отдельную прокрутку над ним. На телефоне откройте клавиатуру: используется фактическая
            видимая область браузера.
          </Text>
        </Stack>
      </SandboxOnly>
      <ToneModal
        opened={kind === OVERLAY_KIND.MODAL}
        onClose={close}
        title="Переименовать папку"
        tone={MODAL_TONE.NEUTRAL}
        icon={FolderIcon}
        fullScreen={compact}
        transitionProps={{ transition: 'fade', duration: 120 }}
        styles={{
          inner: { top: viewport.top, height: viewport.height },
          content: { maxHeight: viewport.height },
        }}
      >
        {kind === OVERLAY_KIND.MODAL && (
          <OverlayContents
            onClose={close}
            isModal
            appearance={appearance}
            toastWidth={toastWidth}
          />
        )}
      </ToneModal>
      <Drawer
        opened={kind === OVERLAY_KIND.DRAWER}
        onClose={close}
        title={
          <Group gap="xs">
            <FolderIcon size={20} />
            <Text fw={600}>Переименовать папку</Text>
          </Group>
        }
        position="right"
        size={compact ? '100%' : 440}
        transitionProps={{ transition: 'fade', duration: 120 }}
        styles={{
          inner: { top: viewport.top, height: viewport.height },
          content: { height: viewport.height },
        }}
      >
        {kind === OVERLAY_KIND.DRAWER && (
          <OverlayContents
            onClose={close}
            isModal={false}
            appearance={appearance}
            toastWidth={toastWidth}
          />
        )}
      </Drawer>
    </Stack>
  );
}

export default OverlayDemo;
