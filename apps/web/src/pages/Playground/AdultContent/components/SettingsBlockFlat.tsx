import { Box, Switch } from '@mantine/core';
import { DropHalfIcon, EyeIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import { getHeadingTexts } from '../lib';
import {
  GROUP_PREVIEW,
  SWITCH_WHEN_LOCKED,
  type FlatConfig,
  type SettingsRenderProps,
} from '../models';
import PreviewRow from './PreviewRow';

type Props = FlatConfig & SettingsRenderProps;

/** R3/R4: две строки без отступа; «Размывать обложки» блокируется, пока 18+ включён. */
function SettingsBlockFlat({
  switchWhenLocked,
  heading,
  preview,
  settings,
  onChange,
  onShowAdultRequest,
}: Props) {
  const texts = getHeadingTexts(heading, settings);
  const isLocked = settings.showAdultSources;
  const isBlurChecked =
    isLocked && switchWhenLocked === SWITCH_WHEN_LOCKED.OFF ? false : settings.hideAdultTitles;

  return (
    <GroupedList label="Контент 18+">
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
      <Box opacity={isLocked ? 0.5 : 1}>
        <GroupedList.Row
          icon={<DropHalfIcon />}
          title={texts.blurTitle}
          description={texts.blurDescription}
          action={
            <Switch
              checked={isBlurChecked}
              disabled={isLocked}
              onChange={(event) => onChange({ hideAdultTitles: event.currentTarget.checked })}
            />
          }
        />
      </Box>
      {preview !== GROUP_PREVIEW.NONE && (
        <PreviewRow settings={settings} withDate={preview === GROUP_PREVIEW.ROW_WITH_DATE} />
      )}
    </GroupedList>
  );
}

export default SettingsBlockFlat;
