import { useState, type ReactNode } from 'react';
import { DEFAULT_SETTINGS } from '../mocks';
import { SETTINGS_COLUMN_WIDTH, type AdultSettings, type SettingsRenderProps } from '../models';
import AgeConfirmModal from './AgeConfirmModal';
import DeviceFrames from './DeviceFrames';

type Props = {
  render: (props: SettingsRenderProps) => ReactNode;
};

/** Блок настроек на десктопе и в телефоне; состояние у них общее. */
function SettingsVariantDemo({ render }: Props) {
  const [settings, setSettings] = useState<AdultSettings>(DEFAULT_SETTINGS);
  const [isConfirmOpened, setIsConfirmOpened] = useState(false);

  const handleChange = (patch: Partial<AdultSettings>) =>
    setSettings((current) => ({ ...current, ...patch }));

  const renderProps: SettingsRenderProps = {
    settings,
    onChange: handleChange,
    onShowAdultRequest: () => setIsConfirmOpened(true),
  };

  return (
    <>
      <DeviceFrames desktopWidth={SETTINGS_COLUMN_WIDTH} render={() => render(renderProps)} />
      <AgeConfirmModal
        opened={isConfirmOpened}
        onClose={() => setIsConfirmOpened(false)}
        onConfirm={() => {
          handleChange({ showAdultSources: true });
          setIsConfirmOpened(false);
        }}
      />
    </>
  );
}

export default SettingsVariantDemo;
