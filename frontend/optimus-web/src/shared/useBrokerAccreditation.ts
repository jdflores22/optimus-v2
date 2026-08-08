import { useSelector } from 'react-redux';
import { useGetAccreditationsQuery } from '../app/api';
import type { RootState } from '../app/store';
import { isBrokerAccredited } from './brokerAccreditation';

export function useBrokerAccreditation() {
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const isBroker = user?.role === 'Broker';
  const { data: accreditations = [], isLoading } = useGetAccreditationsQuery(undefined, {
    skip: !isBroker || !accessToken,
  });

  const brokerAccredited = isBroker
    ? isBrokerAccredited(accreditations, user?.id)
    : true;

  return {
    isBroker,
    brokerAccredited,
    isLoading: isBroker && isLoading,
  };
}
