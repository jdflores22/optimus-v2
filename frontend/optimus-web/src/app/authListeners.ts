import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { api } from './api';
import { logout, setCredentials } from './authSlice';

export const authListenerMiddleware = createListenerMiddleware();

authListenerMiddleware.startListening({
  matcher: isAnyOf(logout, setCredentials),
  effect: (_action, listenerApi) => {
    listenerApi.dispatch(api.util.resetApiState());
  },
});
