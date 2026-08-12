import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import type { RootState } from '../../app/store';
import { canAccessRoute, getAccessDeniedRedirect } from '../../shared/routeAccess';
import { useBrokerAccreditation } from '../../shared/useBrokerAccreditation';
import { useCyStaffAssignment } from '../../shared/useCyStaffAssignment';

type RouteAccessGuardProps = {
  children: React.ReactNode;
};

export function RouteAccessGuard({ children }: RouteAccessGuardProps) {
  const { pathname } = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isBroker, brokerAccredited, isLoading: brokerLoading } = useBrokerAccreditation();
  const { isCyStaff, cyAssigned, isLoading: cyLoading } = useCyStaffAssignment();
  const navOptions =
    isBroker ? { brokerAccredited } : isCyStaff ? { cyAssigned } : undefined;

  if (brokerLoading || cyLoading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!canAccessRoute(pathname, user?.role, navOptions)) {
    return <Navigate to={getAccessDeniedRedirect(user?.role, pathname)} replace />;
  }

  return <>{children}</>;
}
