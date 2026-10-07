import type { Dispatch, SetStateAction } from 'react';
import { ListIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import ResponsiveDrawer from '@/shared/ui/ResponsiveDrawer';
import { DRAWER_POSITION } from '@/shared/ui/ResponsiveDrawer/models';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import MobileNavigationButton from './MobileNavigationButton';
import MobileMenuSections from './MobileMenuSections';
import AccountHeading from '../../components/AccountHeading';

type Props = {
  isActive: boolean;
  isOpened: boolean;
  setIsOpened: Dispatch<SetStateAction<boolean>>;
};

function MobileMenuButton({ isOpened, isActive, setIsOpened }: Props) {
  const { t } = useTranslation();
  const { data: user } = useCurrentUser();

  return (
    <>
      <MobileNavigationButton
        onClick={() => setIsOpened((prev) => !prev)}
        title={t('menu')}
        leftSection={<ListIcon size={20} />}
        isActive={isActive}
      />
      <ResponsiveDrawer
        opened={isOpened}
        onClose={() => setIsOpened(false)}
        side={DRAWER_POSITION.RIGHT}
        title={user ? <AccountHeading user={user} /> : t('menu')}
        // Поле 4px, как у выпадающего меню: строки сами держат отступ 12px, и иконки встают
        // ровно под карточкой в заголовке; снизу — те же 4px, чтобы «Выйти» не висел над пустотой.
        styles={{ body: { paddingInline: 4, paddingBottom: 4 } }}
      >
        <MobileMenuSections onNavigate={() => setIsOpened(false)} />
      </ResponsiveDrawer>
    </>
  );
}

export default MobileMenuButton;
