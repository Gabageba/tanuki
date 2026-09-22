import { Navigate, Outlet, useLocation } from 'react-router';
import useCurrentUser from '@/entities/user/hooks/useCurrentUser';
import { ROUTE_PATHS } from '@/shared/lib/routes';
import FullScreenLoader from '@/shared/ui/FullScreenLoader';

function RequireAuth() {
  const { data: user, isPending } = useCurrentUser();
  const location = useLocation();

  if (isPending) return <FullScreenLoader />;

  if (!user) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`${ROUTE_PATHS.LOGIN}?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}

export default RequireAuth;
