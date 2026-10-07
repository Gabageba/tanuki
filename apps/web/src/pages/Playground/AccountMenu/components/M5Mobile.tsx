import PhoneFrame from './PhoneFrame';
import AccountCard from './AccountCard';
import M5Sections from './M5Sections';
import { MENU_TRIGGER, SHEET_POSITION, type MenuTrigger, type MockUser } from '../models';

type Props = {
  user: MockUser;
  isLarge?: boolean;
  /** Итог: кнопка «Меню», как сейчас, а не аватар. */
  trigger?: MenuTrigger;
};

function M5Mobile({ user, isLarge, trigger = MENU_TRIGGER.AVATAR_PROFILE }: Props) {
  return (
    <PhoneFrame
      user={user}
      trigger={trigger}
      position={SHEET_POSITION.BOTTOM}
      title={<AccountCard user={user} withRole />}
      isFlush
    >
      <M5Sections user={user} isLarge={isLarge} />
    </PhoneFrame>
  );
}

export default M5Mobile;
