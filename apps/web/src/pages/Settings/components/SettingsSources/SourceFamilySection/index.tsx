import { useTranslation } from 'react-i18next';
import type { Source, SourceAccount, SourceAuthFamily } from '@tanuki/contracts';
import GroupedList from '@/shared/ui/GroupedList';
import { getSourceAccountColor, getSourceAccountLabel, getSourcesWithoutLogin } from '../lib';
import SourceAccountIcon from '../SourceAccountIcon';
import SourceToggleRow from '../SourceToggleRow';
import SourceAccountActions from './SourceAccountActions';

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

  const getDescription = () => {
    if (sourcesWithoutLogin.length > 0) {
      return t('noLoginOn', {
        sites: sourcesWithoutLogin.map((source) => source.title).join(', '),
      });
    }
    if (account) {
      return account.login;
    }
    return sources.length > 1 ? t('oneLoginForAllSourcesBelow') : t('loginForSourceBelow');
  };

  return (
    <GroupedList label={title}>
      {sources.length > 0 && (
        <GroupedList.Header
          color={getSourceAccountColor(account)}
          icon={<SourceAccountIcon account={account} />}
          title={getSourceAccountLabel(account, t)}
          description={getDescription()}
          action={
            <SourceAccountActions
              family={family}
              sources={sources}
              sourcesWithoutLogin={sourcesWithoutLogin}
              account={account}
              isLinkingAvailable={isLinkingAvailable}
            />
          }
        />
      )}
      {sources.map((source) => (
        <SourceToggleRow key={source.id} source={source} />
      ))}
    </GroupedList>
  );
}

export default SourceFamilySection;
