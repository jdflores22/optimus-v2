import { createAsyncThunk } from '@reduxjs/toolkit';
import { api } from './api';
import { logout } from './authSlice';
import type { RootState } from './store';

type SignOutOptions = {
  clearReturnPath?: boolean;
};

/** Revoke refresh token server-side, clear RTK Query cache, then drop local auth. */
export const signOut = createAsyncThunk<void, SignOutOptions | undefined>(
  'auth/signOut',
  async (options, { dispatch, getState }) => {
    const { accessToken, refreshToken } = (getState() as RootState).auth;
    if (accessToken && refreshToken) {
      try {
        await dispatch(api.endpoints.logout.initiate({ refreshToken })).unwrap();
      } catch {
        // Best-effort revoke — always clear the local session.
      }
    }
    dispatch(logout(options));
  },
);
