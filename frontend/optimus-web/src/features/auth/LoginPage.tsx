import { FormEvent, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../../app/api';
import { setCredentials } from '../../app/authSlice';
import { AuthSplitLayout } from './AuthSplitLayout';
import { resolvePostLoginPath } from '../../shared/authReturnPath';

const REGISTRATION_ROLES = [
  {
    role: 'Broker',
    to: '/register/broker',
    description: 'Manage manifests and consignee workspaces',
    icon: HandshakeOutlinedIcon,
    tone: 'primary' as const,
  },
  {
    role: 'Consignee',
    to: '/register/consignee',
    description: 'Import cargo and invite broker partners',
    icon: StorefrontOutlinedIcon,
    tone: 'secondary' as const,
  },
  {
    role: 'Trucker',
    to: '/register/trucker',
    description: 'Submit pre-forecast and yard gate requests',
    icon: LocalShippingOutlinedIcon,
    tone: 'info' as const,
  },
];

function RegistrationRoleCard({
  role,
  to,
  description,
  icon: Icon,
  tone,
}: (typeof REGISTRATION_ROLES)[number]) {
  const theme = useTheme();
  const accent =
    tone === 'primary'
      ? theme.palette.primary.main
      : tone === 'secondary'
        ? theme.palette.secondary.main
        : theme.palette.info.main;

  return (
    <Paper
      component={RouterLink}
      to={to}
      elevation={0}
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        textDecoration: 'none',
        color: 'inherit',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease',
        '&:hover': {
          borderColor: alpha(accent, 0.45),
          boxShadow: `0 8px 24px ${alpha(accent, 0.12)}`,
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1.5,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          bgcolor: alpha(accent, theme.palette.mode === 'dark' ? 0.18 : 0.1),
          color: accent,
        }}
      >
        <Icon sx={{ fontSize: 22 }} />
      </Box>
      <Box minWidth={0} flex={1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography variant="subtitle2" fontWeight={700}>
            {role}
          </Typography>
          <ArrowForwardOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
        </Stack>
        <Typography variant="caption" color="text.secondary" lineHeight={1.45} display="block" mt={0.35}>
          {description}
        </Typography>
      </Box>
    </Paper>
  );
}

export function LoginPage() {
  const theme = useTheme();
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
      title="Sign in to OPTIMUS"
      maxWidth={460}
      subtitle="Enter your credentials to access manifests, eDO workflows, and operational tools."
    >
      <Paper
        component="form"
        elevation={0}
        onSubmit={onSubmit}
        sx={{
          p: { xs: 2.5, sm: 3 },
          border: 1,
          borderColor: 'divider',
          borderRadius: 2.5,
          bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.6 : 1),
        }}
      >
        <Stack spacing={2.25}>
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

          <TextField
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoComplete="email"
            placeholder="you@company.com"
          />

          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="current-password"
            placeholder="Enter your password"
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

          <Box textAlign="right" mt={-1.25}>
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

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={isLoading}
            sx={{ py: 1.35, fontWeight: 700, textTransform: 'none', fontSize: '1rem', mt: 0.5 }}
          >
            {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Sign in'}
          </Button>
        </Stack>
      </Paper>

      <Stack spacing={2}>
        <Divider>
          <Typography variant="caption" color="text.secondary" fontWeight={600} px={1}>
            Create an account
          </Typography>
        </Divider>

        <Stack spacing={1.25}>
          {REGISTRATION_ROLES.map((item) => (
            <RegistrationRoleCard key={item.role} {...item} />
          ))}
        </Stack>

        <Paper
          component={RouterLink}
          to="/verify-email"
          elevation={0}
          sx={{
            p: 1.75,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            textDecoration: 'none',
            color: 'inherit',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            borderStyle: 'dashed',
            transition: 'background-color 0.2s ease',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <MarkEmailReadOutlinedIcon sx={{ color: 'text.secondary', fontSize: 22 }} />
          <Box flex={1}>
            <Typography variant="body2" fontWeight={600}>
              Verify your email
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Already registered? Confirm your account to sign in.
            </Typography>
          </Box>
          <ArrowForwardOutlinedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
        </Paper>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          <Link component={RouterLink} to="/versions" fontWeight={600}>
            Release notes
          </Link>{' '}
          — see version history and what&apos;s new in OPTIMUS V2.
        </Typography>
      </Stack>
    </AuthSplitLayout>
  );
}
