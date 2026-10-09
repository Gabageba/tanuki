import { Button, Flex } from '@mantine/core';
import { FunnelIcon, TrashIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { isStaffRole, type NotificationCategory } from '@tanuki/contracts';
import useRemoveAllNotifications from '@/entities/notification/hooks/useRemoveAllNotifications';
import { getCategoryLabel, getVisibleCategories } from '@/entities/notification/lib';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import CompactMultiSelect from '@/shared/ui/CompactMultiSelect';
import PageLayout from '@/shared/ui/PageLayout';

type Params = { categories: NotificationCategory[] };

type Props = {
  isEmpty: boolean;
};

/**
 * Фильтр категорий и «Очистить уведомления». Пустой ленте без фильтра фильтровать нечего — тогда не рисуется;
 * при выбранном фильтре остаётся, чтобы было видно, что именно выбрано.
 */
function NotificationsToolbar({ isEmpty }: Props) {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();
  const { params, setParams } = PageLayout.useParams<Params>();
  const removeAll = useRemoveAllNotifications();

  if (isEmpty && params.categories.length === 0) return null;

  const categories = getVisibleCategories(isStaffRole(user?.role));

  return (
    <Flex
      direction={{ base: 'column', xs: 'row' }}
      gap="sm"
      align={{ base: 'stretch', xs: 'center' }}
      justify="space-between"
    >
      <CompactMultiSelect
        value={params.categories}
        onChange={(next) =>
          setParams({ categories: categories.filter((category) => next.includes(category)) })
        }
        data={categories.map((category) => ({
          value: category,
          label: getCategoryLabel(category, t),
        }))}
        placeholder={t('allCategories')}
        aria-label={t('categories')}
        leftSection={<FunnelIcon size={16} />}
        clearable
        miw={0}
        flex={1}
        maw={360}
      />
      <Button
        variant="subtle"
        color="red"
        leftSection={<TrashIcon />}
        loading={removeAll.isPending}
        disabled={isEmpty}
        onClick={() => removeAll.mutate(params.categories)}
        flex="none"
      >
        {t('clearNotifications')}
      </Button>
    </Flex>
  );
}

export default NotificationsToolbar;
