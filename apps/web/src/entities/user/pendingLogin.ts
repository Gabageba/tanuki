import type { LoginRequest } from '@tanuki/contracts';

type PendingLogin = Omit<LoginRequest, 'cancelDeletion'>;

/** Вход, упёршийся в запланированное удаление, — отмене нужны те же логин и пароль. Держим их только
 *  в памяти: ни в адрес, ни в history.state, ни в хранилище браузера пароль не попадает. После
 *  перезагрузки их нет, и страница отмены отправляет обратно ко входу. */
let pendingLogin: PendingLogin | null = null;

export const getPendingLogin = () => pendingLogin;

export const setPendingLogin = (value: PendingLogin | null) => {
  pendingLogin = value;
};
