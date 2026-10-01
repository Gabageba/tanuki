import { useState, type ReactNode } from 'react';
import type { ReaderSettings } from '@tanuki/contracts';
import type { DemoRenderProps } from '../models';
import DeviceFrames from './DeviceFrames';

type Props = {
  initialSettings: ReaderSettings;
  desktopWidth: number;
  render: (props: DemoRenderProps) => ReactNode;
};

/** Вариант на десктопе и в телефоне с общими настройками: правка в одной рамке видна в обеих. */
function ReaderDemo({ initialSettings, desktopWidth, render }: Props) {
  const [settings, setSettings] = useState(initialSettings);

  const handleChange = (patch: Partial<ReaderSettings>) =>
    setSettings((current) => ({ ...current, ...patch }));

  return (
    <DeviceFrames
      desktopWidth={desktopWidth}
      render={(narrow) => render({ settings, onChange: handleChange, narrow })}
    />
  );
}

export default ReaderDemo;
