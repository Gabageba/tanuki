import {
  DesktopIcon,
  DeviceMobileIcon,
  DeviceTabletIcon,
  QuestionIcon,
} from '@phosphor-icons/react';
import { DEVICE_TYPE, type DeviceType } from '@tanuki/contracts';

export const getDeviceTypeIcon = (deviceType: DeviceType) => {
  switch (deviceType) {
    case DEVICE_TYPE.DESKTOP:
      return <DesktopIcon />;
    case DEVICE_TYPE.MOBILE:
      return <DeviceMobileIcon />;
    case DEVICE_TYPE.TABLET:
      return <DeviceTabletIcon />;
    case DEVICE_TYPE.UNKNOWN:
      return <QuestionIcon />;
  }
};
