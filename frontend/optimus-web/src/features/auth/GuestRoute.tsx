import { Box, CircularProgress } from '@mui/material';
import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useGetMeQuery } from '../../app/api';
import { logout, setUser } from '../../app/authSlice';
import { isPublicAuthPath } from '../../shared/authReturnPath';
import { postAuthHomePath } from '../../shared/postAuthHomePath';
import { useEffect } from 'react';

type GuestRouteProps = {
  children: React.ReactNode;
};

/** Auth pages: redirect away when a stored session is still valid. */
export function GuestRoute({ children }: GuestRouteProps) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { accessToken, user } = useSelector((state: RootState) => state.auth);
  const { data: me, isError, isFetching, isSuccess } = useGetMeQuery(undefined, {
    skip: !accessToken,
  });

  useEffect(() => {
    if (!accessToken) return;
    if (isSuccess && me) {
      dispatch(setUser(me));
    }
    if (isError) {
      dispatch(logout());
    }
  }, [accessToken, dispatch, isError, isSuccess, me]);

  if (accessToken && isFetching) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (accessToken && isSuccess && user) {
    const from = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
    if (from?.pathname && !isPublicAuthPath(from.pathname)) {
      return <Navigate to={`${from.pathname}${from.search ?? ''}`} replace />;
    }
    return <Navigate to={postAuthHomePath(user.role)} replace />;
  }

  if (accessToken && isError) {
    return <>{children}</>;
  }

  if (accessToken && isSuccess) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}
