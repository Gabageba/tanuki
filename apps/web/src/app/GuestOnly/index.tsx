import { Navigate, Outlet } from 'react-router';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import FullScreenLoader from '@/shared/ui/FullScreenLoader';

function GuestOnly() {
  const { data: user, isPending } = useCurrentUser();

  if (isPending) return <FullScreenLoader />;
  if (user) return <Navigate to={ROUTE_PATHS.HOME} replace />;

  return <Outlet />;
}

export default GuestOnly;
