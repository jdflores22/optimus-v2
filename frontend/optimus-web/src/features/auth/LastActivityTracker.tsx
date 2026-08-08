import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { saveLastActivityPath } from '../../shared/authReturnPath';

/** Keeps last visited app route in sync while the user is authenticated. */
export function LastActivityTracker() {
  const { pathname, search } = useLocation();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);

  useEffect(() => {
    if (!accessToken) return;
    saveLastActivityPath(pathname, search);
  }, [accessToken, pathname, search]);

  return null;
}
