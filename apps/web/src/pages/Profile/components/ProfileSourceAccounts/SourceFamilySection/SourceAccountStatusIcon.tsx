import { CheckCircleIcon, UserCircleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { SOURCE_ACCOUNT_STATUS, type SourceAccount } from '@tanuki/contracts';

type Props = {
  account: SourceAccount | undefined;
};

function SourceAccountStatusIcon({ account }: Props) {
  if (!account) return <UserCircleIcon />;
  switch (account.status) {
    case SOURCE_ACCOUNT_STATUS.ACTIVE:
      return <CheckCircleIcon />;
    case SOURCE_ACCOUNT_STATUS.RELOGIN_REQUIRED:
      return <WarningCircleIcon />;
  }
}

export default SourceAccountStatusIcon;
