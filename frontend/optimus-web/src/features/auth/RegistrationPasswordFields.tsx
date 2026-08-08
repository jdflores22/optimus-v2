import { useMemo, useState } from 'react';
import { Box, Stack, TextField, Typography } from '@mui/material';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import {
  evaluatePasswordRules,
  isStrongPassword,
  passwordsMatch,
} from '../../shared/passwordValidation';

export function useRegistrationPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });

  const passwordRules = useMemo(() => evaluatePasswordRules(password), [password]);
  const passwordStrong = isStrongPassword(password);
  const passwordsAreMatching = passwordsMatch(password, confirmPassword);

  const validate = (): string | null => {
    setTouched({ password: true, confirmPassword: true });
    if (!passwordStrong) return 'Password must meet all strength requirements.';
    if (!passwordsAreMatching) return 'Passwords do not match.';
    return null;
  };

  const reset = () => {
    setPassword('');
    setConfirmPassword('');
    setTouched({ password: false, confirmPassword: false });
  };

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    touched,
    setTouched,
    passwordRules,
    passwordStrong,
    passwordsAreMatching,
    validate,
    reset,
  };
}

type RegistrationPasswordFieldsProps = {
  password: string;
  confirmPassword: string;
  touched: { password: boolean; confirmPassword: boolean };
  passwordRules: ReturnType<typeof evaluatePasswordRules>;
  passwordStrong: boolean;
  passwordsAreMatching: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onPasswordBlur: () => void;
  onConfirmPasswordBlur: () => void;
};

export function RegistrationPasswordFields({
  password,
  confirmPassword,
  touched,
  passwordRules,
  passwordStrong,
  passwordsAreMatching,
  onPasswordChange,
  onConfirmPasswordChange,
  onPasswordBlur,
  onConfirmPasswordBlur,
}: RegistrationPasswordFieldsProps) {
  return (
    <>
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        onBlur={onPasswordBlur}
        required
        fullWidth
        autoComplete="new-password"
        error={touched.password && !passwordStrong && password.length > 0}
      />
      <Box
        sx={{
          px: 1.5,
          py: 1.25,
          borderRadius: 1.5,
          bgcolor: 'action.hover',
        }}
      >
        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.75}>
          Password requirements
        </Typography>
        <Stack spacing={0.5}>
          {passwordRules.map((rule) => (
            <Stack key={rule.id} direction="row" spacing={0.75} alignItems="center">
              {rule.passed ? (
                <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 16, color: 'success.main' }} />
              ) : (
                <CancelOutlinedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
              )}
              <Typography variant="caption" color={rule.passed ? 'success.main' : 'text.secondary'}>
                {rule.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
      <TextField
        label="Confirm password"
        type="password"
        value={confirmPassword}
        onChange={(e) => onConfirmPasswordChange(e.target.value)}
        onBlur={onConfirmPasswordBlur}
        required
        fullWidth
        autoComplete="new-password"
        error={touched.confirmPassword && confirmPassword.length > 0 && !passwordsAreMatching}
        helperText={
          touched.confirmPassword && confirmPassword.length > 0 && !passwordsAreMatching
            ? 'Passwords do not match.'
            : touched.confirmPassword && passwordsAreMatching
              ? 'Passwords match.'
              : undefined
        }
      />
    </>
  );
}
