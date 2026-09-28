import { Outlet } from 'react-router';
import { isStaffRole } from '@tanuki/contracts';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import Forbidden from '@/pages/Forbidden';

/** Живёт внутри RequireAuth — сессия уже гарантированно есть, дело за ролью. Пускает и админа, и
 *  модератора — у них одинаковый доступ, кроме управления ролями (см. @tanuki/contracts). */
function RequireStaff() {
  const { data: user } = useCurrentUser();

  if (!isStaffRole(user?.role)) {
    return <Forbidden />;
  }

  return <Outlet />;
}

export default RequireStaff;
