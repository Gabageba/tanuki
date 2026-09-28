import { Button, Group } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { CaretLeftIcon, HouseIcon } from '@phosphor-icons/react';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import PageLayout from '@/shared/ui/PageLayout';
import StatusScreen from '@/shared/ui/StatusScreen';

/** «Нет доступа» — RequireStaff показывает его на месте staff-страницы, адрес не меняется. */
function Forbidden() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <PageLayout>
      <PageLayout.Content>
        <StatusScreen code="403" title={t('noAccess')} description={t('noPermissionToViewPage')}>
          <Group gap="sm">
            <Button onClick={() => navigate(-1)} leftSection={<CaretLeftIcon />} variant="default">
              {t('back')}
            </Button>
            <Button component={Link} to={ROUTE_PATHS.SOURCES} leftSection={<HouseIcon />}>
              {t('toMainPage')}
            </Button>
          </Group>
        </StatusScreen>
      </PageLayout.Content>
    </PageLayout>
  );
}

export default Forbidden;
