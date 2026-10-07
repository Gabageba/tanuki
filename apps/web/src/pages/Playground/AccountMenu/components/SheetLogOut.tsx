import { SignOutIcon } from '@phosphor-icons/react';
import SheetButton from './SheetButton';

function SheetLogOut() {
  return (
    <SheetButton isDanger leftSection={<SignOutIcon />}>
      Выйти
    </SheetButton>
  );
}

export default SheetLogOut;
