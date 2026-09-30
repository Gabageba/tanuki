import { Badge, Group, Text, ThemeIcon, Tooltip } from '@mantine/core';
import SourceIcon from '@/entities/source/components/SourceIcon';
import GroupedList from '@/shared/ui/GroupedList';
import { PRIMARY_COLOR } from '@/shared/lib/palette';
import { getBenefitLabel, getBenefitsText, getRequirementLabel } from '../lib';
import {
  ACCOUNTS_LAYOUT,
  LOGIN_REQUIREMENT,
  type AccountsLayout,
  type DemoSource,
} from '../models';
import { getBenefitIcon, getRequirementIcon } from './lib';

type Props = {
  source: DemoSource;
  layout: AccountsLayout;
  /** Обязательность уже названа в шапке семейства — в строке её не повторяем. */
  isRequirementInHeader: boolean;
};

/** Источник внутри семейства на вкладке аккаунтов: обязателен ли вход и что он даёт. */
function AccountSourceRow({ source, layout, isRequirementInHeader }: Props) {
  const { login } = source;
  if (!login) return null;

  const isRequired = login.requirement === LOGIN_REQUIREMENT.REQUIRED;
  const requirementLabel = getRequirementLabel(login.requirement);
  const requirementBadge = (
    <Badge
      variant={isRequired ? 'light' : 'outline'}
      color={isRequired ? PRIMARY_COLOR : 'gray'}
      size="sm"
      flex="none"
    >
      {requirementLabel}
    </Badge>
  );
  const domain = (
    <Text fz={12} c="dimmed" ff="monospace" truncate>
      {source.domain}
    </Text>
  );

  const getDescription = () => {
    switch (layout) {
      case ACCOUNTS_LAYOUT.ROW_BADGE:
        return getBenefitsText(login.benefits);
      case ACCOUNTS_LAYOUT.HEADER_SUMMARY:
        return (
          <Group gap={4}>
            {login.benefits.map((benefit) => (
              <Badge key={benefit} variant="default" size="sm" tt="none" fw={400}>
                {getBenefitLabel(benefit)}
              </Badge>
            ))}
          </Group>
        );
      case ACCOUNTS_LAYOUT.BENEFIT_ICONS:
        return domain;
    }
  };

  const getAction = () => {
    switch (layout) {
      case ACCOUNTS_LAYOUT.ROW_BADGE:
        return requirementBadge;
      case ACCOUNTS_LAYOUT.HEADER_SUMMARY:
        return isRequirementInHeader ? null : requirementBadge;
      case ACCOUNTS_LAYOUT.BENEFIT_ICONS:
        return (
          <Group gap={4} wrap="nowrap">
            {login.benefits.map((benefit) => (
              <Tooltip key={benefit} label={`Вход даст: ${getBenefitLabel(benefit)}`}>
                <ThemeIcon variant="default" size="md">
                  {getBenefitIcon(benefit)}
                </ThemeIcon>
              </Tooltip>
            ))}
            <Tooltip label={requirementLabel}>
              <ThemeIcon variant="light" color={isRequired ? PRIMARY_COLOR : 'gray'} size="md">
                {getRequirementIcon(login.requirement)}
              </ThemeIcon>
            </Tooltip>
          </Group>
        );
    }
  };

  return (
    <GroupedList.Row
      icon={<SourceIcon id={source.id} title={source.title} size={32} />}
      title={source.title}
      description={getDescription()}
      action={getAction()}
    />
  );
}

export default AccountSourceRow;
