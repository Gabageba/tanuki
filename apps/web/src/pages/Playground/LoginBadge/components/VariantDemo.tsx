import { Box, Group, Stack, Text } from '@mantine/core';
import GroupedList from '@/shared/ui/GroupedList';
import { getPresentMarks, getProfileMark, getSettingsMark } from '../lib';
import { DEMO_SOURCES } from '../mocks';
import { DESKTOP_WIDTH, MOBILE_FRAME_WIDTH, type MarkView, type IconSet } from '../models';
import MarkLegend from './MarkLegend';
import ProfileRow from './ProfileRow';
import SettingsRow from './SettingsRow';

type Props = {
  view: MarkView;
  iconSet: IconSet;
  withLegend: boolean;
  isProfileMarkInTitle: boolean;
};

const PROFILE_SOURCES = DEMO_SOURCES.filter((source) => source.loginRequirement);

/** Оба экрана с пометкой — каждый в колонке десктопа и в рамке телефона. */
function VariantDemo({ view, iconSet, withLegend, isProfileMarkInTitle }: Props) {
  const settings = (
    <Box>
      <GroupedList label="Источники">
        {DEMO_SOURCES.map((source) => (
          <SettingsRow key={source.id} source={source} view={view} iconSet={iconSet} />
        ))}
      </GroupedList>
      {withLegend && (
        <MarkLegend
          marks={getPresentMarks(DEMO_SOURCES.map(getSettingsMark))}
          view={view}
          iconSet={iconSet}
        />
      )}
    </Box>
  );
  const profile = (
    <Box>
      <GroupedList label="Аккаунты источников">
        {PROFILE_SOURCES.map((source) => (
          <ProfileRow
            key={source.id}
            source={source}
            view={view}
            iconSet={iconSet}
            isMarkInTitle={isProfileMarkInTitle}
          />
        ))}
      </GroupedList>
      {withLegend && (
        <MarkLegend
          marks={getPresentMarks(PROFILE_SOURCES.map(getProfileMark))}
          view={view}
          iconSet={iconSet}
        />
      )}
    </Box>
  );

  return (
    <Stack gap="lg" mt="xs">
      {[settings, profile].map((screen, index) => (
        <Group key={index} gap="lg" align="flex-start">
          <Stack gap={6} w={DESKTOP_WIDTH} maw="100%">
            <Text fz={12} c="dimmed">
              Десктоп
            </Text>
            {screen}
          </Stack>
          <Stack gap={6} w={MOBILE_FRAME_WIDTH} maw="100%">
            <Text fz={12} c="dimmed">
              Телефон
            </Text>
            <Box
              p="md"
              style={{
                border: '1px dashed var(--mantine-color-default-border)',
                borderRadius: 'var(--mantine-radius-md)',
              }}
            >
              {screen}
            </Box>
          </Stack>
        </Group>
      ))}
    </Stack>
  );
}

export default VariantDemo;
