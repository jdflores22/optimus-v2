import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../app/store';
import { signOut } from '../../app/authSession';
import { getSessionIdleMinutes, saveLastActivityPath } from '../../shared/authReturnPath';

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'click',
];

/** Logs out after inactivity; last page is preserved for re-login redirect. */
export function SessionIdleGuard() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const timerRef = useRef<number | null>(null);

  const onIdle = useCallback(() => {
    saveLastActivityPath(window.location.pathname, window.location.search);
    void dispatch(signOut({ clearReturnPath: false })).then(() =>
      navigate('/login?reason=timeout', { replace: true }),
    );
  }, [dispatch, navigate]);

  const resetTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
    }
    const idleMs = getSessionIdleMinutes() * 60 * 1000;
    timerRef.current = window.setTimeout(onIdle, idleMs);
  }, [onIdle]);

  useEffect(() => {
    if (!accessToken) return undefined;

    resetTimer();
    const handler = () => resetTimer();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handler, { passive: true });
    }

    return () => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
      }
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handler);
      }
    };
  }, [accessToken, resetTimer]);

  return null;
}
