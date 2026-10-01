import { SegmentedControl, Stack, Switch, Text } from '@mantine/core';
import { EyeIcon } from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import { getHeadingTexts } from '../lib';
import { HEADING_VARIANT, type SettingsRenderProps } from '../models';
import PreviewRow from './PreviewRow';

type Props = SettingsRenderProps;

const SEGMENT = {
  BLUR: 'blur',
  AS_IS: 'asIs',
} as const;

/** R5: одна строка; выбор «размывать / как есть» появляется в ней, пока 18+ выключен. */
function SettingsBlockSegmented({ settings, onChange, onShowAdultRequest }: Props) {
  const texts = getHeadingTexts(HEADING_VARIANT.SHOW, settings);

  return (
    <GroupedList label="Контент 18+">
      <GroupedList.Row
        icon={<EyeIcon />}
        title={texts.mainTitle}
        description={
          <Stack gap={8}>
            {texts.mainDescription}
            {!settings.showAdultSources && (
              <Stack gap={4}>
                <Text fz={12} c="dimmed">
                  Тайтлы 18+ на обычных источниках:
                </Text>
                <SegmentedControl
                  size="xs"
                  w="fit-content"
                  value={settings.hideAdultTitles ? SEGMENT.BLUR : SEGMENT.AS_IS}
                  onChange={(value) => onChange({ hideAdultTitles: value === SEGMENT.BLUR })}
                  data={[
                    { value: SEGMENT.BLUR, label: 'Размывать' },
                    { value: SEGMENT.AS_IS, label: 'Показывать как есть' },
                  ]}
                />
              </Stack>
            )}
          </Stack>
        }
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
      <PreviewRow settings={settings} withDate={false} />
    </GroupedList>
  );
}

export default SettingsBlockSegmented;
