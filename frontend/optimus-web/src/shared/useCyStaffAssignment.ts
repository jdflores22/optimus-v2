import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetCyStaffScopeQuery } from '../app/api';
import type { RootState } from '../app/store';

const POLL_WHEN_UNASSIGNED_MS = 30_000;

export function useCyStaffAssignment() {
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const isCyStaff = user?.role === 'CyStaff';
  const skip = !isCyStaff || !accessToken;
  const [pollMs, setPollMs] = useState(0);

  const { data, isLoading, isFetching } = useGetCyStaffScopeQuery(undefined, {
    skip,
    pollingInterval: pollMs,
  });

  useEffect(() => {
    if (skip) {
      setPollMs(0);
      return;
    }
    setPollMs(data?.hasAssignment === false ? POLL_WHEN_UNASSIGNED_MS : 0);
  }, [skip, data?.hasAssignment]);

  const cyAssigned = !isCyStaff || Boolean(data?.hasAssignment);

  return {
    isCyStaff,
    cyAssigned,
    assignedTerminals: data?.terminals ?? [],
    isLoading: isCyStaff && isLoading,
    isRefreshing: isCyStaff && isFetching && !isLoading,
  };
}
