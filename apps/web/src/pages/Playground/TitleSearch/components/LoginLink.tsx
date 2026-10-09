import { Anchor } from '@mantine/core';
import { Link } from 'react-router';
import { SOURCE_ACCOUNTS_PATH } from '@/shared/lib/routes';

/** «Войти» у источника, где нужен вход, — на вкладку аккаунтов источников в профиле. */
function LoginLink() {
  return (
    <Anchor component={Link} to={SOURCE_ACCOUNTS_PATH} inherit>
      Войти
    </Anchor>
  );
}

export default LoginLink;
