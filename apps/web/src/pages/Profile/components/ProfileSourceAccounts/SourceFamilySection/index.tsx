import { useTranslation } from 'react-i18next';
import type { Source, SourceAccount, SourceAuthFamily } from '@tanuki/contracts';
import GroupedList from '@/shared/ui/GroupedList';
import {
  getSourceAccountStatusColor,
  getSourceAccountStatusLabel,
  getSourcesWithoutLogin,
} from '@/entities/source-account/lib';
import SourceAccountRow from './SourceAccountRow';
import SourceAccountStatusIcon from '@/entities/source-account/SourceAccountStatusIcon';
import SourceAccountStatusActions from '../SourceAccountStatusActions';

type Props = {
  title: string;
  family: SourceAuthFamily;
  sources: Source[];
  accounts: SourceAccount[];
  isLinkingAvailable: boolean;
};

function SourceFamilySection({ title, family, sources, accounts, isLinkingAvailable }: Props) {
  const { t } = useTranslation();

  const account = accounts.find((item) => item.family === family);
  const sourcesWithoutLogin = getSourcesWithoutLogin(account, sources);

  if (sources.length === 0) return null;

  const getDescription = () => {
    if (sourcesWithoutLogin.length > 0) {
      return t('noLoginOn', {
        sites: sourcesWithoutLogin.map((source) => source.title).join(', '),
      });
    }
    if (account) {
      return account.login;
    }
    return sources.length > 1 ? t('oneLoginForAllSourcesInGroup') : t('loginForThisSource');
  };

  return (
    <GroupedList
      label={title}
      aside={
        <GroupedList.Header
          isAside
          color={getSourceAccountStatusColor(account)}
          icon={<SourceAccountStatusIcon account={account} />}
          title={getSourceAccountStatusLabel(account, t)}
          description={getDescription()}
          action={
            <SourceAccountStatusActions
              family={family}
              sources={sources}
              sourcesWithoutLogin={sourcesWithoutLogin}
              account={account}
              isLinkingAvailable={isLinkingAvailable}
            />
          }
        />
      }
    >
      {sources.map((source) => (
        <SourceAccountRow key={source.id} source={source} />
      ))}
    </GroupedList>
  );
}

export default SourceFamilySection;
