import { Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { ArrowClockwiseIcon, SignInIcon } from '@phosphor-icons/react';
import { SOURCE_ACCOUNT_STATUS, type Source, type SourceAccount } from '@tanuki/contracts';
import GroupedList from '@/shared/ui/GroupedList';
import { SOURCE_ACCOUNTS_PATH } from '@/shared/lib/routes';
import {
  getSourceAccountStatusColor,
  getSourceAccountStatusLabel,
} from '../../ProfileSourceAccounts/lib';
import { getSourcesWithoutLogin } from '../../ProfileSourceAccounts/SourceFamilySection/lib';
import SourceAccountStatusIcon from '../../ProfileSourceAccounts/SourceFamilySection/SourceAccountStatusIcon';
import ImportSourceRow from './ImportSourceRow';

type Props = {
  title: string;
  sources: Source[];
  account: SourceAccount | undefined;
  sourceId: string | null;
};

/**
 * Сеть в выборе «откуда импортировать»: шапка аккаунта, как на вкладке аккаунтов, под ней
 * источники сети. Войти отсюда нельзя — кнопка ведёт на вкладку аккаунтов.
 */
function ImportSourceFamily({ title, sources, account, sourceId }: Props) {
  const { t } = useTranslation();
  const color = getSourceAccountStatusColor(account);
  const sourcesWithoutLogin = getSourcesWithoutLogin(account, sources);
  const isReloginRequired = account?.status === SOURCE_ACCOUNT_STATUS.RELOGIN_REQUIRED;

  const getDescription = () => {
    if (sourcesWithoutLogin.length > 0) {
      return t('noLoginOn', {
        sites: sourcesWithoutLogin.map((source) => source.title).join(', '),
      });
    }
    return account?.login;
  };

  return (
    <GroupedList label={title}>
      <GroupedList.Header
        color={color}
        icon={<SourceAccountStatusIcon account={account} />}
        title={getSourceAccountStatusLabel(account, t)}
        description={getDescription()}
        action={
          (!account || isReloginRequired || sourcesWithoutLogin.length > 0) && (
            <Button
              component={Link}
              to={SOURCE_ACCOUNTS_PATH}
              size="xs"
              variant="muted"
              color={color}
              leftSection={isReloginRequired ? <ArrowClockwiseIcon /> : <SignInIcon />}
            >
              {isReloginRequired ? t('logInAgain') : t('logIn')}
            </Button>
          )
        }
      />
      {sources.map((source) => (
        <ImportSourceRow key={source.id} source={source} isSelected={source.id === sourceId} />
      ))}
    </GroupedList>
  );
}

export default ImportSourceFamily;
