import { Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Source } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import SourceLoginBadge from '@/entities/source/components/SourceLoginBadge';
import { getSourceLoginBenefitLabel } from '@/entities/source/lib';
import GroupedList from '@/shared/ui/GroupedList';

type Props = {
  source: Source;
};

function SourceAccountRow({ source }: Props) {
  const { t } = useTranslation();
  const { loginBenefits } = source;

  return (
    <GroupedList.Row
      icon={<SourceIcon id={source.id} title={source.title} size={32} />}
      title={source.title}
      description={
        loginBenefits.length > 0 ? (
          t('loginGives', {
            benefits: loginBenefits
              .map((benefit) => getSourceLoginBenefitLabel(benefit, t))
              .join(', '),
          })
        ) : (
          <Text fz={12} c="dimmed" ff="monospace" truncate>
            {source.domain}
          </Text>
        )
      }
      action={<SourceLoginBadge source={source} />}
    />
  );
}

export default SourceAccountRow;
