import { useState, type ReactNode } from 'react';
import { Stack, Text } from '@mantine/core';
import { getLockTexts } from '../lib';
import { DEFAULT_SETTINGS } from '../mocks';
import {
  SETTINGS_COLUMN_WIDTH,
  type AdultSettings,
  type DescriptionMode,
  type Framing,
  type FramingRenderProps,
  type TermForms,
} from '../models';
import AgeConfirmModal from './AgeConfirmModal';
import DeviceFrames from './DeviceFrames';
import LockCard from './LockCard';

type Props = {
  framing: Framing;
  term: TermForms;
  mode: DescriptionMode;
  render: (props: FramingRenderProps) => ReactNode;
};

type PendingReveal = {
  patch: Partial<AdultSettings>;
  reveals: string;
};

/**
 * Подача целиком: блок настроек на десктопе и в телефоне и заглушка тайтла под ним — с общим
 * состоянием. Всё, что открывает 18+, идёт через подтверждение возраста.
 */
function FramingDemo({ framing, term, mode, render }: Props) {
  const [settings, setSettings] = useState<AdultSettings>(DEFAULT_SETTINGS);
  const [pending, setPending] = useState<PendingReveal | null>(null);

  const handleChange = (patch: Partial<AdultSettings>) =>
    setSettings((current) => ({ ...current, ...patch }));

  const handleReveal = (patch: Partial<AdultSettings>, reveals: string) =>
    setPending({ patch, reveals });

  const renderProps: FramingRenderProps = {
    settings,
    term,
    mode,
    onChange: handleChange,
    onReveal: handleReveal,
  };

  return (
    <Stack gap="md">
      <DeviceFrames desktopWidth={SETTINGS_COLUMN_WIDTH} render={() => render(renderProps)} />
      <Stack gap={6} maw={SETTINGS_COLUMN_WIDTH}>
        <Text fz={12} c="dimmed">
          Заглушка тайтла 18+ (S1)
        </Text>
        <LockCard settings={settings} texts={getLockTexts(framing, term)} onReveal={handleReveal} />
      </Stack>
      <AgeConfirmModal
        opened={!!pending}
        reveals={pending?.reveals}
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (pending) handleChange(pending.patch);
          setPending(null);
        }}
      />
    </Stack>
  );
}

export default FramingDemo;
