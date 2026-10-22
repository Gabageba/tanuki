import { Avatar, Indicator } from '@mantine/core';
import { CloudSlashIcon } from '@phosphor-icons/react';
import { PRIMARY_COLOR, STATUS_DEGRADED_COLOR } from '@/shared/lib/palette';

type Props = {
  isOffline: boolean;
  size?: number;
};

/** Аватар в шапке; N13 — золотой значок облака в углу, пока нет сети. */
function OfflineAvatar({ isOffline, size = 34 }: Props) {
  return (
    <Indicator
      disabled={!isOffline}
      color={STATUS_DEGRADED_COLOR}
      size={16}
      offset={4}
      position="bottom-end"
      label={<CloudSlashIcon size={10} weight="bold" />}
    >
      <Avatar color={PRIMARY_COLOR} variant="outline" name="gabageba" size={size} />
    </Indicator>
  );
}

export default OfflineAvatar;
