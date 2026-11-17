import { Button, Menu, type MantineColor } from '@mantine/core';
import { DotsThreeIcon, LinkBreakIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import type { SourceAccount } from '@tanuki/contracts';
import useUnlinkSourceAccount from '../hooks/useUnlinkSourceAccount';

type Props = {
  account: SourceAccount | undefined;
  isLinkingAvailable: boolean;
  color?: MantineColor;
};

function SourceAccountMenu({ account, isLinkingAvailable, color = 'gray' }: Props) {
  const { t } = useTranslation();
  const unlink = useUnlinkSourceAccount();

  if (!account) return null;

  return (
    <Menu position="bottom-end">
      <Menu.Target>
        <Button
          variant="muted"
          color={color}
          size="xs"
          w={30}
          px={0}
          leftSection={<DotsThreeIcon />}
          styles={{ section: { marginInlineEnd: 0 } }}
          aria-label={t('accountActions')}
          disabled={!isLinkingAvailable}
          loading={unlink.isPending}
        />
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          color="red"
          leftSection={<LinkBreakIcon />}
          disabled={!isLinkingAvailable || unlink.isPending}
          onClick={() => unlink.mutate(account.family)}
        >
          {t('unlinkAccount')}
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export default SourceAccountMenu;
