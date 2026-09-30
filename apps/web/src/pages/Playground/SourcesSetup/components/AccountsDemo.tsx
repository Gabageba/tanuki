import { SimpleGrid } from '@mantine/core';
import GroupedList from '@/shared/ui/GroupedList';
import {
  getAccountStateColor,
  getAccountStateLabel,
  getFamilySources,
  getRequirementLabel,
} from '../lib';
import {
  ACCOUNT_STATE,
  ACCOUNTS_LAYOUT,
  DEMO_FAMILIES,
  DEMO_SOURCES,
  type AccountsLayout,
  type DemoFamily,
  type DemoSource,
} from '../models';
import AccountAction from './AccountAction';
import AccountSourceRow from './AccountSourceRow';
import { getAccountStateIcon } from './lib';

type Props = {
  layout: AccountsLayout;
};

/** «Профиль → Аккаунты источников»: семейства, как сейчас в настройках, но без выключателей. */
function AccountsDemo({ layout }: Props) {
  const getDescription = (family: DemoFamily, sources: DemoSource[], isUniform: boolean) => {
    const login = family.state === ACCOUNT_STATE.NONE ? null : family.login;
    const count = sources.length > 1 ? 'Один вход для всех источников ниже' : null;
    const requirement =
      layout === ACCOUNTS_LAYOUT.HEADER_SUMMARY && isUniform && sources[0]?.login
        ? getRequirementLabel(sources[0].login.requirement)
        : null;
    return [login ?? count, requirement].filter(Boolean).join(' · ');
  };

  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
      {DEMO_FAMILIES.map((family) => {
        const sources = getFamilySources(family, DEMO_SOURCES);
        const isUniform = new Set(sources.map((source) => source.login?.requirement)).size === 1;

        return (
          <GroupedList key={family.key} label={family.title}>
            <GroupedList.Header
              color={getAccountStateColor(family.state)}
              icon={getAccountStateIcon(family.state)}
              title={getAccountStateLabel(family.state)}
              description={getDescription(family, sources, isUniform)}
              action={<AccountAction state={family.state} />}
            />
            {sources.map((source) => (
              <AccountSourceRow
                key={source.id}
                source={source}
                layout={layout}
                isRequirementInHeader={isUniform}
              />
            ))}
          </GroupedList>
        );
      })}
    </SimpleGrid>
  );
}

export default AccountsDemo;
