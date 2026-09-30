import { NavLink, Stack, Text } from '@mantine/core';
import { CheckIcon, SignInIcon } from '@phosphor-icons/react';
import SourceIcon from '@/entities/source/components/SourceIcon';
import GroupedList from '@/shared/ui/GroupedList';
import { getAccountStateColor, getAccountStateLabel } from '../../SourcesSetup/lib';
import { ACCOUNT_STATE } from '../../SourcesSetup/models';
import { getAccountStateIcon } from '../../SourcesSetup/components/lib';
import { DEMO_NETWORKS } from '../lib';
import type { VariantProps } from '../models';

/**
 * C3 — те же рамки с шапкой аккаунта, что на вкладке «Аккаунты источников»: вход назван один раз
 * на сеть, под шапкой — её источники. Сеть без входа сворачивается в одну шапку с кнопкой.
 */
function VariantGrouped({ sourceId, onChange }: VariantProps) {
  return (
    <Stack gap="md">
      {DEMO_NETWORKS.map((network) => {
        const isActive = network.state === ACCOUNT_STATE.ACTIVE;

        return (
          <GroupedList key={network.title} label={network.title}>
            <GroupedList.Header
              icon={getAccountStateIcon(network.state)}
              color={getAccountStateColor(network.state)}
              title={getAccountStateLabel(network.state)}
              description={
                isActive ? (
                  <Text fz={12} ff="monospace" inherit>
                    {network.login}
                  </Text>
                ) : (
                  network.sources.map(({ title }) => title).join(', ')
                )
              }
              actionProps={
                isActive ? undefined : { leftSection: <SignInIcon />, children: 'Войти' }
              }
            />
            {isActive &&
              network.sources.map((source) => (
                <NavLink
                  key={source.id}
                  component="button"
                  type="button"
                  px="md"
                  label={source.title}
                  active={source.id === sourceId}
                  leftSection={<SourceIcon id={source.id} title={source.title} size={24} />}
                  rightSection={source.id === sourceId ? <CheckIcon /> : undefined}
                  onClick={() => onChange(source.id)}
                />
              ))}
          </GroupedList>
        );
      })}
    </Stack>
  );
}

export default VariantGrouped;
