import { FormEvent, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../../app/api';
import { setCredentials } from '../../app/authSlice';
import { AuthSplitLayout } from './AuthSplitLayout';
import { resolvePostLoginPath } from '../../shared/authReturnPath';

const authPrimaryButtonSx = {
  py: 1.35,
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
} as const;

function LoginRegisterLinks() {
  const links = [
    { label: 'Broker', to: '/register/broker' },
    { label: 'Consignee', to: '/register/consignee' },
    { label: 'Trucker', to: '/register/trucker' },
  ];

  return (
    <Stack spacing={0.75} alignItems="center">
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        Register as
      </Typography>
      <Stack direction="row" spacing={2}>
        {links.map((link) => (
          <Link key={link.to} component={RouterLink} to={link.to} variant="body2">
            {link.label}
          </Link>
        ))}
      </Stack>
      <Link component={RouterLink} to="/verify-email" variant="caption" color="text.secondary">
        Verify your email
      </Link>
    </Stack>
  );
}

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionTimeout = searchParams.get('reason') === 'timeout';
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const result = await login({ email, password }).unwrap();
      dispatch(
        setCredentials({
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user,
        }),
      );
      navigate(resolvePostLoginPath(result.user.role), { replace: true });
    } catch (err) {
      const message =
        typeof err === 'object' && err && 'data' in err
          ? String((err as { data?: { error?: string } }).data?.error ?? 'Login failed')
          : 'Login failed';
      setError(message);
    }
  };

  return (
    <AuthSplitLayout
      title="Sign in"
      maxWidth={440}
      subtitle={
        <>
          Sign in to OPTIMUS.{' '}
          <Link component={RouterLink} to="/register/broker" fontWeight={600}>
            Register
          </Link>{' '}
          if you need an account.
        </>
      }
    >
      <Stack spacing={2} component="form" onSubmit={onSubmit}>
        {sessionTimeout && (
          <Alert severity="warning">
            Your session expired due to inactivity. Sign in again to continue where you left off.
          </Alert>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {import.meta.env.DEV && (
          <Alert severity="info" sx={{ py: 0.75 }}>
            <Typography variant="caption" component="div">
              <strong>Dev demo:</strong> admin@optimus.local / Admin123!
            </Typography>
          </Alert>
        )}

        <Stack spacing={2} sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}>
          <TextField
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoComplete="email"
          />

          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? (
                      <VisibilityOffOutlinedIcon fontSize="small" />
                    ) : (
                      <VisibilityOutlinedIcon fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box textAlign="right">
            <Link
              component={RouterLink}
              to="/forgot-password"
              underline="hover"
              variant="body2"
              fontWeight={600}
            >
              Forgot password?
            </Link>
          </Box>
        </Stack>

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={isLoading}
          sx={authPrimaryButtonSx}
        >
          {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Sign in'}
        </Button>

        <LoginRegisterLinks />
      </Stack>
    </AuthSplitLayout>
  );
}
