import DrawerPanel from '../DrawerPanel';
import AccountCard from '../AccountCard';
import M5Sections from '../M5Sections';
import { HEADER_STYLE, type HeaderStyle, type MockUser } from '../../models';

type Props = {
  headerStyle: HeaderStyle;
  user: MockUser;
};

function MenuDrawerMock({ headerStyle, user }: Props) {
  return (
    <DrawerPanel
      title={headerStyle === HEADER_STYLE.TEXT ? 'Меню' : <AccountCard user={user} withRole />}
      isFlush
    >
      <M5Sections user={user} />
    </DrawerPanel>
  );
}

export default MenuDrawerMock;
