import { FormEvent, useEffect, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { pageHeroGradient } from '../../shared/theme';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import {
  useGetMeQuery,
  useRemoveProfilePhotoMutation,
  useRequestOtpMutation,
  useResetPasswordMutation,
  useUpdateProfileMutation,
  useUploadProfilePhotoMutation,
} from '../../app/api';
import { setUser } from '../../app/authSlice';
import { Link as RouterLink } from 'react-router-dom';
import { useDefaultShippingLine } from '../../shared/useDefaultShippingLine';
import { resolveUploadUrl, type UpdateProfileRequest, type UserDto } from '../../shared/types';
import { formatRoleLabel } from '../../shared/roleLabels';
import { ProfileAvatar } from '../../shared/ProfileAvatar';
import { prepareProfilePhoto } from '../../shared/profilePhotoUtils';

type ProfileTab = 'profile' | 'security' | 'account';

export function ProfilePage() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { shippingLine } = useDefaultShippingLine();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<ProfileTab>('profile');

  const { data: me } = useGetMeQuery(undefined, { skip: !user });
  const [uploadProfilePhoto, { isLoading: uploadingPhoto }] = useUploadProfilePhotoMutation();
  const [removeProfilePhoto, { isLoading: removingPhoto }] = useRemoveProfilePhotoMutation();
  const [updateProfile, { isLoading: savingProfile }] = useUpdateProfileMutation();
  const [requestOtp, { isLoading: requesting }] = useRequestOtpMutation();
  const [resetPassword, { isLoading: resetting }] = useResetPasswordMutation();

  const [profileForm, setProfileForm] = useState(buildProfileForm(user));
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (me) {
      dispatch(setUser(me));
      setProfileForm(buildProfileForm(me));
    }
  }, [me, dispatch]);

  useEffect(() => {
    if (!selectedPhoto) {
      setPhotoPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(selectedPhoto);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedPhoto]);

  const email = user?.email ?? '';
  const initials = getInitials(user?.fullName || user?.businessName || user?.email || 'U');
  const displayName = user?.businessName || user?.fullName || 'Your account';
  const profilePhotoUrl = photoPreviewUrl ?? resolveUploadUrl(user?.profilePhotoPath);
  const role = user?.role ?? '';

  const onChoosePhoto = () => {
    fileInputRef.current?.click();
  };

  const onPhotoSelected = async (file: File | undefined) => {
    setPhotoMessage(null);
    setPhotoError(null);
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setPhotoError('Please choose a JPEG, PNG, GIF, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be 5 MB or smaller.');
      return;
    }
    try {
      const prepared = await prepareProfilePhoto(file);
      setSelectedPhoto(prepared);
      if (file.type === 'image/png') {
        setPhotoMessage('PNG detected — white background applied for visibility.');
      }
    } catch {
      setPhotoError('Could not process the selected image.');
    }
  };

  const onUploadPhoto = async () => {
    if (!selectedPhoto) return;
    setPhotoMessage(null);
    setPhotoError(null);
    try {
      const updated = await uploadProfilePhoto(selectedPhoto).unwrap();
      dispatch(setUser(updated));
      setSelectedPhoto(null);
      setPhotoMessage('Profile photo updated.');
    } catch {
      setPhotoError('Could not upload profile photo.');
    }
  };

  const onRemovePhoto = async () => {
    setPhotoMessage(null);
    setPhotoError(null);
    setSelectedPhoto(null);
    try {
      const updated = await removeProfilePhoto().unwrap();
      dispatch(setUser(updated));
      setPhotoMessage('Profile photo removed.');
    } catch {
      setPhotoError('Could not remove profile photo.');
    }
  };

  const onSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileError(null);

    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      setProfileError('First name and last name are required.');
      return;
    }

    const payload: UpdateProfileRequest = {
      firstName: profileForm.firstName.trim(),
      lastName: profileForm.lastName.trim(),
    };

    if (role === 'Consignee') {
      payload.businessName = profileForm.businessName.trim();
    }
    if (role === 'Broker') {
      payload.businessAddress = profileForm.businessAddress.trim();
    }
    if (role === 'SlStaff' || role === 'TerminalTeam') {
      payload.department = profileForm.department.trim();
    }
    if (role === 'Trucker') {
      payload.phoneNumber = profileForm.phoneNumber.trim();
      payload.licenseNumber = profileForm.licenseNumber.trim();
      payload.companyName = profileForm.companyName.trim();
      payload.truckPlateNumber = profileForm.truckPlateNumber.trim();
    }

    try {
      const updated = await updateProfile(payload).unwrap();
      dispatch(setUser(updated));
      setProfileForm(buildProfileForm(updated));
      setProfileMessage('Profile information saved.');
    } catch {
      setProfileError('Could not save profile information.');
    }
  };

  const onRequestOtp = async () => {
    setError(null);
    setMessage(null);
    try {
      const res = await requestOtp({ email }).unwrap();
      setOtpSent(true);
      setMessage(res.message || 'OTP sent. Check your email or server logs in development.');
    } catch {
      setError('Could not request OTP.');
    }
  };

  const onResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      const res = await resetPassword({ email, otp, newPassword }).unwrap();
      setMessage(res.message || 'Password updated.');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setOtpSent(false);
    } catch {
      setError('Password reset failed. Check the OTP and try again.');
    }
  };

  return (
    <Stack spacing={3} maxWidth={920}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          border: 1,
          borderColor: 'divider',
          borderRadius: 3,
          background: pageHeroGradient(theme.palette.mode),
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ sm: 'center' }}>
          <ProfileAvatar
            src={profilePhotoUrl}
            photoPath={user?.profilePhotoPath}
            photoMimeType={selectedPhoto?.type}
            sx={{
              width: 72,
              height: 72,
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            {initials}
          </ProfileAvatar>
          <Box minWidth={0}>
            <Typography variant="h4" fontWeight={800} lineHeight={1.2}>
              Profile Settings
            </Typography>
            <Typography variant="body1" color="text.secondary" mt={0.75}>
              Manage your photo, personal details, password, and account access.
            </Typography>
            <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1} mt={2}>
              <Chip size="small" color="primary" label={formatRoleLabel(role) || role || 'User'} />
              <Chip
                size="small"
                color={/approved|active/i.test(user?.status ?? '') ? 'success' : 'default'}
                label={user?.status ?? '—'}
              />
              {user?.businessName && <Chip size="small" variant="outlined" label={user.businessName} />}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(_, value: ProfileTab) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 1,
            borderBottom: 1,
            borderColor: 'divider',
            minHeight: 44,
            '& .MuiTab-root': { minHeight: 44, textTransform: 'none', fontWeight: 600 },
          }}
        >
          <Tab value="profile" label="Profile" />
          <Tab value="security" label="Security" />
          <Tab value="account" label="Account" />
        </Tabs>

        <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
          {tab === 'profile' && (
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h6" fontWeight={700} mb={0.5}>
                  Profile Photo
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  JPEG, PNG, GIF, or WebP up to 5 MB.
                </Typography>

                {photoMessage && <Alert severity="success" sx={{ mb: 2 }}>{photoMessage}</Alert>}
                {photoError && <Alert severity="error" sx={{ mb: 2 }}>{photoError}</Alert>}

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ sm: 'center' }}>
                  <ProfileAvatar
                    src={profilePhotoUrl}
                    photoPath={user?.profilePhotoPath}
                    photoMimeType={selectedPhoto?.type}
                    sx={{
                      width: 96,
                      height: 96,
                      fontSize: 32,
                      fontWeight: 700,
                    }}
                  >
                    {initials}
                  </ProfileAvatar>

                  <Stack spacing={1.25} flex={1}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      hidden
                      onChange={(e) => onPhotoSelected(e.target.files?.[0])}
                    />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap flexWrap="wrap">
                      <Button
                        variant="outlined"
                        startIcon={<PhotoCameraOutlinedIcon />}
                        onClick={onChoosePhoto}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Choose photo
                      </Button>
                      {selectedPhoto && (
                        <Button
                          variant="contained"
                          startIcon={<CloudUploadOutlinedIcon />}
                          onClick={onUploadPhoto}
                          disabled={uploadingPhoto}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Upload
                        </Button>
                      )}
                      {user?.profilePhotoPath && !selectedPhoto && (
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteOutlineOutlinedIcon />}
                          onClick={onRemovePhoto}
                          disabled={removingPhoto}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Remove
                        </Button>
                      )}
                    </Stack>
                    {selectedPhoto && (
                      <Typography variant="caption" color="text.secondary">
                        Selected: {selectedPhoto.name}
                      </Typography>
                    )}
                  </Stack>
                </Stack>
              </Box>

              <Divider />

              <Box component="form" onSubmit={onSaveProfile}>
                <Typography variant="h6" fontWeight={700} mb={0.5}>
                  Personal Information
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Update your name and role-specific details. Email and role are managed by administrators.
                </Typography>

                {profileMessage && <Alert severity="success" sx={{ mb: 2 }}>{profileMessage}</Alert>}
                {profileError && <Alert severity="error" sx={{ mb: 2 }}>{profileError}</Alert>}

                <Box
                  sx={{
                    display: 'grid',
                    gap: 1.5,
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  }}
                >
                  <TextField
                    label="First name"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm((f) => ({ ...f, firstName: e.target.value }))}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Last name"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm((f) => ({ ...f, lastName: e.target.value }))}
                    required
                    fullWidth
                  />
                  <TextField
                    label="Email address"
                    value={email}
                    disabled
                    fullWidth
                    helperText="Contact an administrator to change your email."
                  />
                  <TextField
                    label="Role"
                    value={formatRoleLabel(role) || role}
                    disabled
                    fullWidth
                  />

                  {role === 'Consignee' && (
                    <TextField
                      label="Business name"
                      value={profileForm.businessName}
                      onChange={(e) => setProfileForm((f) => ({ ...f, businessName: e.target.value }))}
                      required
                      fullWidth
                      sx={{ gridColumn: { md: '1 / -1' } }}
                    />
                  )}

                  {role === 'Broker' && (
                    <TextField
                      label="Business address"
                      value={profileForm.businessAddress}
                      onChange={(e) => setProfileForm((f) => ({ ...f, businessAddress: e.target.value }))}
                      fullWidth
                      multiline
                      minRows={2}
                      sx={{ gridColumn: { md: '1 / -1' } }}
                    />
                  )}

                  {(role === 'SlStaff' || role === 'TerminalTeam') && (
                    <TextField
                      label="Department"
                      value={profileForm.department}
                      onChange={(e) => setProfileForm((f) => ({ ...f, department: e.target.value }))}
                      fullWidth
                      sx={{ gridColumn: { md: '1 / -1' } }}
                    />
                  )}

                  {role === 'Trucker' && (
                    <>
                      <TextField
                        label="Phone number"
                        value={profileForm.phoneNumber}
                        onChange={(e) => setProfileForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                        fullWidth
                      />
                      <TextField
                        label="License number"
                        value={profileForm.licenseNumber}
                        onChange={(e) => setProfileForm((f) => ({ ...f, licenseNumber: e.target.value }))}
                        fullWidth
                      />
                      <TextField
                        label="Company name"
                        value={profileForm.companyName}
                        onChange={(e) => setProfileForm((f) => ({ ...f, companyName: e.target.value }))}
                        fullWidth
                      />
                      <TextField
                        label="Truck plate number"
                        value={profileForm.truckPlateNumber}
                        onChange={(e) => setProfileForm((f) => ({ ...f, truckPlateNumber: e.target.value }))}
                        fullWidth
                      />
                    </>
                  )}
                </Box>

                <Stack direction="row" justifyContent="flex-end" mt={2.5}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveOutlinedIcon />}
                    disabled={savingProfile}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Save changes
                  </Button>
                </Stack>
              </Box>
            </Stack>
          )}

          {tab === 'security' && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" fontWeight={700} mb={0.5}>
                  Change Password
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  We send a one-time code to <strong>{email}</strong>, then you confirm a new password.
                </Typography>
              </Box>

              {message && <Alert severity="success">{message}</Alert>}
              {error && <Alert severity="error">{error}</Alert>}

              <Stack spacing={2} component="form" onSubmit={onResetPassword}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ sm: 'center' }}>
                  <Button
                    variant="outlined"
                    onClick={onRequestOtp}
                    disabled={requesting || !email}
                    startIcon={<LockOutlinedIcon />}
                    sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 600 }}
                  >
                    {otpSent ? 'Resend OTP' : 'Send OTP'}
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Request a fresh code whenever you need to rotate your password.
                  </Typography>
                </Stack>

                {(otpSent || otp) && (
                  <>
                    <Divider />
                    <Box
                      sx={{
                        display: 'grid',
                        gap: 1.5,
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                      }}
                    >
                      <TextField
                        label="OTP code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        fullWidth
                      />
                      <Box />
                      <TextField
                        label="New password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        fullWidth
                        helperText="At least 8 characters"
                      />
                      <TextField
                        label="Confirm password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        fullWidth
                      />
                    </Box>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={resetting}
                      sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 600 }}
                    >
                      Update password
                    </Button>
                  </>
                )}
              </Stack>
            </Stack>
          )}

          {tab === 'account' && (
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h6" fontWeight={700} mb={0.5}>
                  Account Summary
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Read-only account details and workspace shortcuts.
                </Typography>
                <Stack spacing={1.5}>
                  <SummaryRow label="Display name" value={displayName} />
                  <SummaryRow label="Full name" value={user?.fullName} />
                  <SummaryRow label="Email" value={email || '—'} />
                  <SummaryRow label="Role" value={formatRoleLabel(role) || role} />
                  <SummaryRow label="Status" value={user?.status} />
                  <SummaryRow label="User type" value={user?.userType} />
                  <SummaryRow label="Shipping line" value={shippingLine?.brandName ?? 'Default shipping line'} />
                </Stack>
              </Box>

              {role === 'Broker' && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} mb={0.75}>
                      Workspace Access
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      Switch consignee workspace or apply a referral code from your broker tools.
                    </Typography>
                    <Button
                      component={RouterLink}
                      to="/workspace"
                      variant="outlined"
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Open workspace
                    </Button>
                  </Box>
                </>
              )}

              <Divider />

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(11,61,92,0.04)',
                }}
              >
                <Typography variant="subtitle1" fontWeight={700} mb={0.75}>
                  Security Notes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Keep your password private and request a fresh OTP whenever you need to update your credentials.
                </Typography>
              </Box>
            </Stack>
          )}
        </Box>
      </Paper>
    </Stack>
  );
}

type ProfileFormState = {
  firstName: string;
  lastName: string;
  businessName: string;
  businessAddress: string;
  department: string;
  phoneNumber: string;
  licenseNumber: string;
  companyName: string;
  truckPlateNumber: string;
};

function buildProfileForm(user?: UserDto | null): ProfileFormState {
  return {
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    businessName: user?.businessName ?? '',
    businessAddress: user?.businessAddress ?? '',
    department: user?.department ?? '',
    phoneNumber: user?.phoneNumber ?? '',
    licenseNumber: user?.licenseNumber ?? '',
    companyName: user?.companyName ?? '',
    truckPlateNumber: user?.truckPlateNumber ?? '',
  };
}

function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'U';
}

function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="space-between"
      spacing={2}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} sx={{ textAlign: { xs: 'left', sm: 'right' }, wordBreak: 'break-word' }}>
        {value || '—'}
      </Typography>
    </Stack>
  );
}
