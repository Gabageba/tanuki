import { Radio, Stack, Text } from '@mantine/core';
import type { SourceId } from '@tanuki/contracts';
import GroupedList from '@/shared/ui/GroupedList';
import { getAccountStateColor } from '../../SourcesSetup/lib';
import { ACCOUNT_STATE } from '../../SourcesSetup/models';
import { getAccountStateIcon } from '../../SourcesSetup/components/lib';
import { DEMO_NETWORKS, getShortStateLabel } from '../lib';
import type { DemoNetwork, VariantProps } from '../models';
import LoginActionButton from './LoginActionButton';
import SourceRow from './SourceRow';

type Props = VariantProps & {
  /** C1d: сеть без входа — только шапка, её источники перечислены в описании, а не строками. */
  isLockedCollapsed?: boolean;
};

/**
 * C1c и C1d — C1b в рамке с шапкой аккаунта, как на вкладке «Аккаунты источников»: шапка называет
 * состояние входа, под ней в той же рамке — источники сети.
 */
function VariantCardsHeader({ sourceId, onChange, isLockedCollapsed = false }: Props) {
  const getDescription = (network: DemoNetwork, isCollapsed: boolean) => {
    if (isCollapsed) return network.sources.map(({ title }) => title).join(', ');
    if (network.state === ACCOUNT_STATE.NONE) return null;
    return (
      <Text ff="monospace" inherit>
        {network.login}
      </Text>
    );
  };

  return (
    <Radio.Group value={sourceId} onChange={(value) => onChange(value as SourceId)}>
      <Stack gap="md">
        {DEMO_NETWORKS.map((network) => {
          const isCollapsed = isLockedCollapsed && network.state !== ACCOUNT_STATE.ACTIVE;

          return (
            <GroupedList key={network.title} label={network.title}>
              <GroupedList.Header
                icon={getAccountStateIcon(network.state)}
                color={getAccountStateColor(network.state)}
                title={getShortStateLabel(network.state)}
                description={getDescription(network, isCollapsed)}
                action={<LoginActionButton state={network.state} />}
              />
              {!isCollapsed &&
                network.sources.map((source) => (
                  <SourceRow key={source.id} source={source} isSelected={source.id === sourceId} />
                ))}
            </GroupedList>
          );
        })}
      </Stack>
    </Radio.Group>
  );
}

export default VariantCardsHeader;
