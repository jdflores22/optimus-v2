import { Alert, Button, Stack, Typography } from '@mui/material';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import { useGetCyStaffScopeQuery } from '../../app/api';
import { useCyStaffAssignment } from '../../shared/useCyStaffAssignment';

export function CyStaffWaitingBanner() {
  const { isCyStaff, cyAssigned, isRefreshing } = useCyStaffAssignment();
  const { refetch } = useGetCyStaffScopeQuery(undefined, { skip: !isCyStaff || cyAssigned });

  if (!isCyStaff || cyAssigned) return null;

  return (
    <Alert
      severity="warning"
      sx={{ mb: 2, borderRadius: 2 }}
      action={
        <Button
          color="inherit"
          size="small"
          startIcon={<RefreshOutlinedIcon />}
          disabled={isRefreshing}
          onClick={() => void refetch()}
          sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          Check again
        </Button>
      }
    >
      <Stack spacing={0.5}>
        <Typography variant="subtitle2" fontWeight={700}>
          Waiting for container yard assignment
        </Typography>
        <Typography variant="body2">
          A system administrator must assign you as CY contact on a TEU contract before pre-forecast,
          inventory, and other yard tools unlock. You can update your profile and notifications while
          you wait.
        </Typography>
      </Stack>
    </Alert>
  );
}
