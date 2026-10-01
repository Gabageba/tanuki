import { Box, Group, Stack, Switch, Text } from '@mantine/core';
import { DropHalfIcon, EyeIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import { getSettingsTexts, isBlurActive } from '../lib';
import { LOCKED_TITLE } from '../mocks';
import {
  COVER_PREVIEW,
  NESTED_LAYOUT,
  type AdultSettings,
  type CopyVariant,
  type CoverPreview,
  type NestedLayout,
} from '../models';
import MockCover from './MockCover';

type Props = {
  settings: AdultSettings;
  layout: NestedLayout;
  copy: CopyVariant;
  preview: CoverPreview;
  /** Включение главного тумблера идёт через подтверждение возраста, выключение — сразу. */
  onShowAdultRequest: () => void;
  onChange: (patch: Partial<AdultSettings>) => void;
};

// Иконка 24 + gap md 16: заголовок вложенной строки встаёт под заголовок главной.
const NESTED_INDENT = 40;

/** R1/R2: главный тумблер «Показывать 18+» и вложенное «Размывать обложки». */
function SettingsBlockNested({
  settings,
  layout,
  copy,
  preview,
  onShowAdultRequest,
  onChange,
}: Props) {
  const texts = getSettingsTexts(copy, settings);
  const isNestedShown = layout === NESTED_LAYOUT.DISABLED || !settings.showAdultSources;

  const blurSwitch = (
    <Switch
      checked={settings.hideAdultTitles}
      disabled={settings.showAdultSources}
      onChange={(event) => onChange({ hideAdultTitles: event.currentTarget.checked })}
    />
  );

  return (
    <Stack gap="xs">
      <GroupedList label={texts.groupLabel}>
        <GroupedList.Row
          icon={<EyeIcon />}
          title={texts.mainTitle}
          description={texts.mainDescription}
          action={
            <Switch
              checked={settings.showAdultSources}
              onChange={(event) =>
                event.currentTarget.checked
                  ? onShowAdultRequest()
                  : onChange({ showAdultSources: false })
              }
            />
          }
        />
        {isNestedShown && (
          <Box pl={NESTED_INDENT} opacity={settings.showAdultSources ? 0.6 : 1}>
            <GroupedList.Row
              icon={<DropHalfIcon />}
              title={texts.blurTitle}
              description={texts.blurDescription}
              action={
                preview === COVER_PREVIEW.INLINE ? (
                  <Group gap="sm" wrap="nowrap">
                    <Box w={30}>
                      <MockCover title={LOCKED_TITLE} blurred={isBlurActive(settings)} compact />
                    </Box>
                    {blurSwitch}
                  </Group>
                ) : (
                  blurSwitch
                )
              }
            />
          </Box>
        )}
      </GroupedList>
      {texts.groupCaption && (
        <Text fz={12} c="dimmed" lh={1.3} px="md">
          {texts.groupCaption}
        </Text>
      )}
    </Stack>
  );
}

export default SettingsBlockNested;
