import { FormEvent, useEffect, useRef, useState } from 'react';
import { Alert, Button, CircularProgress, Link, Stack, TextField, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { Link as RouterLink } from 'react-router-dom';
import {
  useRegisterBrokerMutation,
  useRegisterConsigneeMutation,
  useRegisterTruckerMutation,
  useRequestOtpMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
  useGetInvitationQuery,
  useAcceptInvitationMutation,
} from '../../app/api';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../app/authSlice';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AuthSplitLayout } from './AuthSplitLayout';
import { postAuthHomePath } from '../../shared/postAuthHomePath';
import { getApiErrorMessage } from '../../shared/apiErrorMessage';
import {
  RegistrationPasswordFields,
  useRegistrationPassword,
} from './RegistrationPasswordFields';

const FIELD_LABELS: Record<string, string> = {
  email: 'Email address',
  password: 'Password',
  firstName: 'First name',
  lastName: 'Last name',
  businessAddress: 'Business address',
  businessName: 'Business name',
  referralCode: 'Referral code',
  companyName: 'Company name',
  phoneNumber: 'Phone number',
  licenseNumber: 'Driver license number',
  truckPlateNumber: 'Truck plate number',
};

function RegisterRoleLinks({ current }: { current: 'broker' | 'consignee' | 'trucker' }) {
  const links = [
    { role: 'broker' as const, label: 'Broker', to: '/register/broker' },
    { role: 'consignee' as const, label: 'Consignee', to: '/register/consignee' },
    { role: 'trucker' as const, label: 'Trucker', to: '/register/trucker' },
  ].filter((link) => link.role !== current);

  return (
    <Stack spacing={0.75} alignItems="center">
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        Register as
      </Typography>
      <Stack direction="row" spacing={2}>
        {links.map((link) => (
          <Link key={link.role} component={RouterLink} to={link.to} variant="body2">
            {link.label}
          </Link>
        ))}
      </Stack>
    </Stack>
  );
}

function RegistrationSubmitButton({
  loading,
  disabled,
  label,
}: {
  loading: boolean;
  disabled: boolean;
  label: string;
}) {
  return (
    <Button
      type="submit"
      variant="contained"
      size="large"
      fullWidth
      disabled={disabled || loading}
      sx={{ py: 1.35, fontWeight: 600, textTransform: 'none', fontSize: '1rem' }}
    >
      {loading ? <CircularProgress size={22} color="inherit" /> : label}
    </Button>
  );
}

export function RegisterBrokerPage() {
  const [register, { isLoading }] = useRegisterBrokerMutation();
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    businessAddress: '',
    referralCode: '',
  });
  const passwordFields = useRegistrationPassword();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    form.email.trim() &&
    form.firstName.trim() &&
    form.lastName.trim() &&
    passwordFields.passwordStrong &&
    passwordFields.passwordsAreMatching &&
    !isLoading;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const passwordError = passwordFields.validate();
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      const res = await register({
        email: form.email.trim(),
        password: passwordFields.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        businessAddress: form.businessAddress.trim() || undefined,
        referralCode: form.referralCode.trim() || undefined,
      }).unwrap();
      setMessage(res.message);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed.'));
    }
  };

  return (
    <AuthSplitLayout
      title="Sign up"
      maxWidth={440}
      subtitle={
        <>
          Register as a broker.{' '}
          <Link component={RouterLink} to="/login" fontWeight={600}>
            Sign in
          </Link>{' '}
          if you already have an account.
        </>
      }
    >
      <Stack spacing={2} component="form" onSubmit={onSubmit}>
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {isLoading && (
          <Alert severity="info" icon={<CircularProgress size={18} color="inherit" />}>
            Creating your account and sending a verification email…
          </Alert>
        )}
        <Stack component="fieldset" disabled={isLoading} spacing={2} sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}>
        <TextField
          label={FIELD_LABELS.email}
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          fullWidth
          autoComplete="email"
        />
        <TextField
          label={FIELD_LABELS.firstName}
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          required
          fullWidth
          autoComplete="given-name"
        />
        <TextField
          label={FIELD_LABELS.lastName}
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          required
          fullWidth
          autoComplete="family-name"
        />
        <TextField
          label={FIELD_LABELS.businessAddress}
          value={form.businessAddress}
          onChange={(e) => setForm({ ...form, businessAddress: e.target.value })}
          fullWidth
          autoComplete="street-address"
        />
        <TextField
          label={FIELD_LABELS.referralCode}
          value={form.referralCode}
          onChange={(e) => setForm({ ...form, referralCode: e.target.value.toUpperCase() })}
          fullWidth
          helperText="Optional. You can apply a consignee referral code later from your workspace."
        />
        <RegistrationPasswordFields
          password={passwordFields.password}
          confirmPassword={passwordFields.confirmPassword}
          touched={passwordFields.touched}
          passwordRules={passwordFields.passwordRules}
          passwordStrong={passwordFields.passwordStrong}
          passwordsAreMatching={passwordFields.passwordsAreMatching}
          onPasswordChange={passwordFields.setPassword}
          onConfirmPasswordChange={passwordFields.setConfirmPassword}
          onPasswordBlur={() =>
            passwordFields.setTouched((prev) => ({ ...prev, password: true }))
          }
          onConfirmPasswordBlur={() =>
            passwordFields.setTouched((prev) => ({ ...prev, confirmPassword: true }))
          }
        />
        </Stack>
        <RegistrationSubmitButton
          loading={isLoading}
          disabled={!canSubmit}
          label="Create broker account"
        />
        <RegisterRoleLinks current="broker" />
      </Stack>
    </AuthSplitLayout>
  );
}

export function RegisterConsigneePage() {
  const [register, { isLoading }] = useRegisterConsigneeMutation();
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    businessName: '',
  });
  const passwordFields = useRegistrationPassword();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    form.email.trim() &&
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.businessName.trim() &&
    passwordFields.passwordStrong &&
    passwordFields.passwordsAreMatching &&
    !isLoading;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const passwordError = passwordFields.validate();
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      const res = await register({
        email: form.email.trim(),
        password: passwordFields.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        businessName: form.businessName.trim(),
      }).unwrap();
      setMessage(res.message);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed.'));
    }
  };

  return (
    <AuthSplitLayout
      title="Sign up"
      maxWidth={440}
      subtitle={
        <>
          Register as a consignee.{' '}
          <Link component={RouterLink} to="/login" fontWeight={600}>
            Sign in
          </Link>{' '}
          if you already have an account.
        </>
      }
    >
      <Stack spacing={2} component="form" onSubmit={onSubmit}>
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {isLoading && (
          <Alert severity="info" icon={<CircularProgress size={18} color="inherit" />}>
            Creating your account and sending a verification email…
          </Alert>
        )}
        <Stack component="fieldset" disabled={isLoading} spacing={2} sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}>
        <TextField
          label={FIELD_LABELS.email}
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          fullWidth
          autoComplete="email"
        />
        <TextField
          label={FIELD_LABELS.firstName}
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          required
          fullWidth
          autoComplete="given-name"
        />
        <TextField
          label={FIELD_LABELS.lastName}
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          required
          fullWidth
          autoComplete="family-name"
        />
        <TextField
          label={FIELD_LABELS.businessName}
          value={form.businessName}
          onChange={(e) => setForm({ ...form, businessName: e.target.value })}
          required
          fullWidth
          autoComplete="organization"
        />
        <RegistrationPasswordFields
          password={passwordFields.password}
          confirmPassword={passwordFields.confirmPassword}
          touched={passwordFields.touched}
          passwordRules={passwordFields.passwordRules}
          passwordStrong={passwordFields.passwordStrong}
          passwordsAreMatching={passwordFields.passwordsAreMatching}
          onPasswordChange={passwordFields.setPassword}
          onConfirmPasswordChange={passwordFields.setConfirmPassword}
          onPasswordBlur={() =>
            passwordFields.setTouched((prev) => ({ ...prev, password: true }))
          }
          onConfirmPasswordBlur={() =>
            passwordFields.setTouched((prev) => ({ ...prev, confirmPassword: true }))
          }
        />
        </Stack>
        <RegistrationSubmitButton
          loading={isLoading}
          disabled={!canSubmit}
          label="Create consignee account"
        />
        <RegisterRoleLinks current="consignee" />
      </Stack>
    </AuthSplitLayout>
  );
}

export function RegisterTruckerPage() {
  const [register, { isLoading }] = useRegisterTruckerMutation();
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    companyName: '',
    phoneNumber: '',
    licenseNumber: '',
    truckPlateNumber: '',
  });
  const passwordFields = useRegistrationPassword();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    form.email.trim() &&
    form.firstName.trim() &&
    form.lastName.trim() &&
    passwordFields.passwordStrong &&
    passwordFields.passwordsAreMatching &&
    !isLoading;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const passwordError = passwordFields.validate();
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      const res = await register({
        email: form.email.trim(),
        password: passwordFields.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        companyName: form.companyName.trim() || undefined,
        phoneNumber: form.phoneNumber.trim() || undefined,
        licenseNumber: form.licenseNumber.trim() || undefined,
        truckPlateNumber: form.truckPlateNumber.trim() || undefined,
      }).unwrap();
      setMessage(res.message);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed.'));
    }
  };

  return (
    <AuthSplitLayout
      title="Sign up"
      maxWidth={440}
      subtitle={
        <>
          Register as a trucker for pre-advice and yard submissions.{' '}
          <Link component={RouterLink} to="/login" fontWeight={600}>
            Sign in
          </Link>{' '}
          if you already have an account.
        </>
      }
    >
      <Stack spacing={2} component="form" onSubmit={onSubmit}>
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {isLoading && (
          <Alert severity="info" icon={<CircularProgress size={18} color="inherit" />}>
            Creating your account and sending a verification email…
          </Alert>
        )}
        <Stack component="fieldset" disabled={isLoading} spacing={2} sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}>
        <TextField
          label={FIELD_LABELS.email}
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          fullWidth
          autoComplete="email"
        />
        <TextField
          label={FIELD_LABELS.firstName}
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          required
          fullWidth
          autoComplete="given-name"
        />
        <TextField
          label={FIELD_LABELS.lastName}
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          required
          fullWidth
          autoComplete="family-name"
        />
        <TextField
          label={FIELD_LABELS.companyName}
          value={form.companyName}
          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          fullWidth
          autoComplete="organization"
        />
        <TextField
          label={FIELD_LABELS.phoneNumber}
          value={form.phoneNumber}
          onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
          fullWidth
          autoComplete="tel"
        />
        <TextField
          label={FIELD_LABELS.licenseNumber}
          value={form.licenseNumber}
          onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
          fullWidth
        />
        <TextField
          label={FIELD_LABELS.truckPlateNumber}
          value={form.truckPlateNumber}
          onChange={(e) => setForm({ ...form, truckPlateNumber: e.target.value.toUpperCase() })}
          fullWidth
        />
        <RegistrationPasswordFields
          password={passwordFields.password}
          confirmPassword={passwordFields.confirmPassword}
          touched={passwordFields.touched}
          passwordRules={passwordFields.passwordRules}
          passwordStrong={passwordFields.passwordStrong}
          passwordsAreMatching={passwordFields.passwordsAreMatching}
          onPasswordChange={passwordFields.setPassword}
          onConfirmPasswordChange={passwordFields.setConfirmPassword}
          onPasswordBlur={() =>
            passwordFields.setTouched((prev) => ({ ...prev, password: true }))
          }
          onConfirmPasswordBlur={() =>
            passwordFields.setTouched((prev) => ({ ...prev, confirmPassword: true }))
          }
        />
        </Stack>
        <RegistrationSubmitButton
          loading={isLoading}
          disabled={!canSubmit}
          label="Create trucker account"
        />
        <RegisterRoleLinks current="trucker" />
      </Stack>
    </AuthSplitLayout>
  );
}

export function ForgotPasswordPage() {
  const [requestOtp] = useRequestOtpMutation();
  const [resetPassword] = useResetPasswordMutation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <AuthSplitLayout
      title="Forgot password"
      subtitle="Request an OTP, then set a new password for your account."
    >
      <Stack spacing={2}>
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />
        <Button
          variant="outlined"
          size="large"
          fullWidth
          sx={{ textTransform: 'none', fontWeight: 600 }}
          onClick={async () => {
            setError(null);
            try {
              const res = await requestOtp({ email }).unwrap();
              setMessage(`${res.message} Check API logs for OTP in Phase 1.`);
            } catch {
              setError('Failed to request OTP.');
            }
          }}
        >
          Request OTP
        </Button>
        <TextField label="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} fullWidth />
        <TextField
          label="New password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          size="large"
          fullWidth
          sx={{ py: 1.35, fontWeight: 600, textTransform: 'none', fontSize: '1rem' }}
          onClick={async () => {
            setError(null);
            try {
              const res = await resetPassword({ email, otp, newPassword }).unwrap();
              setMessage(res.message);
            } catch {
              setError('Reset failed.');
            }
          }}
        >
          Reset password
        </Button>
      </Stack>
    </AuthSplitLayout>
  );
}

export function VerifyEmailPage() {
  const [verifyEmail] = useVerifyEmailMutation();
  const [searchParams] = useSearchParams();
  const linkToken = searchParams.get('token')?.trim() ?? '';
  const [manualToken, setManualToken] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkStatus, setLinkStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const attemptedLinkVerification = useRef(false);

  useEffect(() => {
    if (!linkToken || attemptedLinkVerification.current) {
      return;
    }

    const storageKey = `optimus-email-verified:${linkToken}`;
    if (sessionStorage.getItem(storageKey) === '1') {
      setMessage('Your email has been verified.');
      setLinkStatus('success');
      return;
    }

    attemptedLinkVerification.current = true;

    const verifyFromLink = async () => {
      setLinkStatus('verifying');
      setError(null);
      try {
        const res = await verifyEmail({ token: linkToken }).unwrap();
        sessionStorage.setItem(storageKey, '1');
        setMessage(res.message ?? 'Your email has been verified.');
        setLinkStatus('success');
      } catch (err) {
        setError(getApiErrorMessage(err, 'Verification failed. The link may have expired.'));
        setLinkStatus('error');
      }
    };

    void verifyFromLink();
    // verifyEmail is intentionally omitted to avoid duplicate POSTs when RTK Query recreates the hook fn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkToken]);

  if (linkToken) {
    if (linkStatus === 'idle' || linkStatus === 'verifying') {
      return (
        <AuthSplitLayout
          title="Verifying email"
          subtitle="Please wait while we confirm your email address."
        >
          <Stack spacing={2} alignItems="center" sx={{ py: 2 }}>
            <CircularProgress size={40} />
            <Typography color="text.secondary">This only takes a moment.</Typography>
          </Stack>
        </AuthSplitLayout>
      );
    }

    if (linkStatus === 'success') {
      return (
        <AuthSplitLayout
          title="Email verified"
          subtitle="Your account is ready. You can now sign in to OPTIMUS."
        >
          <Stack spacing={2.5} alignItems="center" sx={{ py: 1 }}>
            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 56 }} />
            <Alert severity="success" sx={{ width: '100%' }}>
              {message ?? 'Your email has been verified successfully.'}
            </Alert>
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              size="large"
              fullWidth
              sx={{ py: 1.35, fontWeight: 600, textTransform: 'none', fontSize: '1rem' }}
            >
              Sign in
            </Button>
          </Stack>
        </AuthSplitLayout>
      );
    }

    return (
      <AuthSplitLayout
        title="Verification failed"
        subtitle="This link is invalid or has expired."
      >
        <Stack spacing={2}>
          <Alert severity="error">{error}</Alert>
          <Typography color="text.secondary" variant="body2">
            If you already verified this email, try signing in. Otherwise register again to receive a new link.
          </Typography>
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            size="large"
            fullWidth
            sx={{ py: 1.35, fontWeight: 600, textTransform: 'none', fontSize: '1rem' }}
          >
            Sign in
          </Button>
          <Button
            component={RouterLink}
            to="/register/trucker"
            variant="outlined"
            size="large"
            fullWidth
            sx={{ py: 1.35, fontWeight: 600, textTransform: 'none', fontSize: '1rem' }}
          >
            Register again
          </Button>
        </Stack>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      title="Verify email"
      subtitle="Paste the verification token from your registration email."
    >
      <Stack spacing={2}>
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Verification token"
          value={manualToken}
          onChange={(e) => setManualToken(e.target.value)}
          helperText="Sent to your inbox after registration"
          fullWidth
        />
        <Button
          variant="contained"
          size="large"
          fullWidth
          sx={{ py: 1.35, fontWeight: 600, textTransform: 'none', fontSize: '1rem' }}
          onClick={async () => {
            setError(null);
            try {
              const res = await verifyEmail({ token: manualToken.trim() }).unwrap();
              setMessage(res.message ?? 'Your email has been verified.');
            } catch (err) {
              setError(getApiErrorMessage(err, 'Verification failed.'));
            }
          }}
        >
          Verify
        </Button>
      </Stack>
    </AuthSplitLayout>
  );
}

export function RoleAcceptancePage() {
  const { token = '' } = useParams();
  const { data, error: loadError } = useGetInvitationQuery(token, { skip: !token });
  const [acceptInvitation] = useAcceptInvitationMutation();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <AuthSplitLayout
      title="Accept invitation"
      subtitle="Set a password to activate your invited role on OPTIMUS."
    >
      <Stack spacing={2}>
        {loadError && <Alert severity="error">Invitation not found.</Alert>}
        {data && (
          <Alert severity="info">
            Invite for {data.firstName} {data.lastName} as {data.role}
          </Alert>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Set password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={!data}
          sx={{ py: 1.35, fontWeight: 600, textTransform: 'none', fontSize: '1rem' }}
          onClick={async () => {
            setError(null);
            try {
              const result = await acceptInvitation({ token, password }).unwrap();
              dispatch(
                setCredentials({
                  accessToken: result.accessToken,
                  refreshToken: result.refreshToken,
                  user: result.user,
                }),
              );
              navigate(postAuthHomePath(result.user.role));
            } catch {
              setError('Accept failed.');
            }
          }}
        >
          Accept invitation
        </Button>
      </Stack>
    </AuthSplitLayout>
  );
}
