import { Button, Divider, Stack } from '@mantine/core';
import { BookOpenIcon } from '@phosphor-icons/react';
import { generatePath, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { Source } from '@tanuki/contracts';
import SourceIcon from '@/entities/source/components/SourceIcon';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import EntityHeading from '@/shared/ui/EntityHeading';
import ResponsiveDrawer from '@/shared/ui/ResponsiveDrawer';
import { DRAWER_POSITION } from '@/shared/ui/ResponsiveDrawer/models';
import ProbeSourceButton from './ProbeSourceButton';
import ReasonBlock from './ReasonBlock';
import SourceFields from './SourceFields';

type Props = {
  source: Source | null;
  /** «Проверить сейчас» — только персоналу, как и сама ручка. */
  isStaff: boolean;
  onClose: () => void;
};

/** Карточка источника, устроенная как карточка пользователя: в заголовке иконка, название и
 *  домен, ниже поля, под ними причина заголовком к полному тексту ошибки, действия внизу. Справа,
 *  на телефоне — снизу. */
function SourceDrawer({ source, isStaff, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <ResponsiveDrawer
      opened={source !== null}
      onClose={onClose}
      side={DRAWER_POSITION.RIGHT}
      sideSize={420}
      title={
        source ? (
          <EntityHeading
            icon={<SourceIcon id={source.id} title={source.title} size={40} />}
            title={source.title}
            subtitle={source.domain}
          />
        ) : (
          t('source')
        )
      }
    >
      {source && (
        <Stack gap="md">
          <SourceFields source={source} />
          <ReasonBlock source={source} />

          <Divider />

          <Stack gap="xs">
            {isStaff && <ProbeSourceButton source={source} />}
            <Button
              component={Link}
              to={generatePath(ROUTE_PATHS.CATALOG, { sourceId: source.id })}
              variant="default"
              leftSection={<BookOpenIcon />}
            >
              {t('openCatalog')}
            </Button>
          </Stack>
        </Stack>
      )}
    </ResponsiveDrawer>
  );
}

export default SourceDrawer;
