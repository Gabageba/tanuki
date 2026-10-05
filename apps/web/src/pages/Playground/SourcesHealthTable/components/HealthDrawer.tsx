import { Drawer, useMatches } from '@mantine/core';
import type { DrawerLayout, MockSource, Viewer } from '../models';
import HealthDrawerContent from './HealthDrawerContent';
import HealthDrawerTitle from './HealthDrawerTitle';

type Props = {
  source: MockSource | null;
  layout: DrawerLayout;
  viewer: Viewer;
  onClose: () => void;
};

/** Справа, на телефоне — снизу, как карточка пользователя. */
function HealthDrawer({ source, layout, viewer, onClose }: Props) {
  const position = useMatches<'bottom' | 'right'>({ base: 'bottom', sm: 'right' });

  return (
    <Drawer
      opened={source !== null}
      onClose={onClose}
      position={position}
      size={position === 'bottom' ? 'auto' : 420}
      title={source && <HealthDrawerTitle source={source} layout={layout} />}
    >
      {source && <HealthDrawerContent source={source} layout={layout} viewer={viewer} />}
    </Drawer>
  );
}

export default HealthDrawer;
