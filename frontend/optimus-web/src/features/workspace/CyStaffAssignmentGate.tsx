import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import WarehouseOutlinedIcon from '@mui/icons-material/WarehouseOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../app/store';
import { signOut } from '../../app/authSession';
import { isCyStaffOpenWithoutAssignment } from '../../shared/cyStaffAssignment';
import { useCyStaffAssignment } from '../../shared/useCyStaffAssignment';

type CyStaffUnassignedModalProps = {
  open: boolean;
  isRefreshing?: boolean;
};

export function CyStaffUnassignedModal({ open, isRefreshing }: CyStaffUnassignedModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const onSignOut = () => {
    void dispatch(signOut()).then(() => navigate('/login'));
  };

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      aria-labelledby="cy-staff-unassigned-title"
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle id="cy-staff-unassigned-title" sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'warning.main',
              color: 'warning.contrastText',
            }}
          >
            <WarehouseOutlinedIcon />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1.25}>
              No container yard assigned
            </Typography>
            <Typography variant="body2" color="text.secondary">
              CY staff access is pending setup
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} pt={0.5}>
          <Typography color="text.secondary">
            Your account is not linked to a container yard yet. A system administrator must assign
            you as the CY contact on a TEU contract allocation before you can use pre-forecast,
            inventory, and other yard workflows.
          </Typography>
          <Box
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: 1.5,
              bgcolor: (t) =>
                t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)',
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              What you can do now
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update your profile or check notifications while you wait. This screen will unlock
              automatically once your assignment is saved.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center" minHeight={36}>
              {isRefreshing ? (
                <>
                  <CircularProgress size={18} />
                  <Typography variant="caption" color="text.secondary">
                    Checking for assignment…
                  </Typography>
                </>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Checking for assignment every 30 seconds
                </Typography>
              )}
            </Stack>
            <Button
              color="inherit"
              startIcon={<LogoutOutlinedIcon />}
              onClick={onSignOut}
              sx={{ textTransform: 'none', fontWeight: 600, flexShrink: 0 }}
            >
              Sign out
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

/**
 * CyStaff must be assigned to at least one container yard (via TEU contract CY contact)
 * before using yard workflows. Mirrors BrokerWorkspaceGate open-path exceptions.
 */
export function CyStaffAssignmentGate() {
  const location = useLocation();
  const { isCyStaff, cyAssigned, isLoading, isRefreshing } = useCyStaffAssignment();

  if (!isCyStaff) {
    return <Outlet />;
  }

  const openPath = isCyStaffOpenWithoutAssignment(location.pathname);

  if (isLoading && !openPath) {
    return (
      <Stack alignItems="center" py={8} spacing={2}>
        <CircularProgress size={28} />
        <Typography color="text.secondary">Checking container yard assignment…</Typography>
      </Stack>
    );
  }

  if (!cyAssigned && !openPath) {
    return (
      <>
        <Navigate to="/profile" replace state={{ from: location.pathname }} />
        <CyStaffUnassignedModal open isRefreshing={isRefreshing} />
      </>
    );
  }

  return <Outlet />;
}
