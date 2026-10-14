import { use } from 'react';
import { ActionIcon, Box, Indicator, TextInput } from '@mantine/core';
import { CloudSlashIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';
import { PHONE_FRAME_CONTEXT } from '../../Notifications/models';

const GOLD = `var(--mantine-color-${STATUS_DEGRADED_COLOR}-filled)`;

/** N10 — поиск в шапке сам говорит, что сети нет: облако вместо лупы и плейсхолдер про скачанное.
 *  В реализации это проп у `SearchInput` (иконка и плейсхолдер), а не отдельное поле. */
function OfflineSearchField() {
  const isPhone = use(PHONE_FRAME_CONTEXT);

  if (isPhone) {
    return (
      <Indicator
        color={STATUS_DEGRADED_COLOR}
        size={16}
        offset={6}
        position="bottom-end"
        label={<CloudSlashIcon size={10} weight="bold" />}
      >
        <ActionIcon variant="subtle" color="gray" size={34} aria-label="Поиск среди скачанного">
          <MagnifyingGlassIcon size={20} />
        </ActionIcon>
      </Indicator>
    );
  }

  return (
    <Box flex={1} maw={420}>
      <TextInput
        leftSection={<CloudSlashIcon color={GOLD} />}
        placeholder="Нет сети — ищем среди скачанного"
        aria-label="Поиск среди скачанного"
      />
    </Box>
  );
}

export default OfflineSearchField;
