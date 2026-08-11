import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { Box, Paper, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export type PreForecastStepState = 'complete' | 'current' | 'upcoming';

export type PreForecastStep = {
  key: string;
  label: string;
  detail: string;
  state: PreForecastStepState;
};

type Props = {
  steps: PreForecastStep[];
  onStepClick?: (index: number) => void;
};

function stepCircleSx(state: PreForecastStepState, primary: string) {
  if (state === 'complete') {
    return { bgcolor: primary, color: '#fff', border: `2px solid ${primary}` };
  }
  if (state === 'current') {
    return { bgcolor: 'background.paper', color: primary, border: `2px solid ${primary}`, boxShadow: `0 0 0 4px rgba(11,61,92,0.12)` };
  }
  return { bgcolor: 'action.hover', color: 'text.disabled', border: '2px solid', borderColor: 'divider' };
}

export function PreForecastProgressStrip({ steps, onStepClick }: Props) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2, md: 0 },
          gridTemplateColumns: { xs: '1fr', md: `repeat(${steps.length}, 1fr)` },
        }}
      >
        {steps.map((step, index) => {
          const clickable = step.state === 'complete' && onStepClick;
          return (
            <Box
              key={step.key}
              onClick={clickable ? () => onStepClick(index) : undefined}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              onKeyDown={
                clickable
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onStepClick(index);
                      }
                    }
                  : undefined
              }
              sx={{
                display: 'flex',
                gap: 1.5,
                alignItems: 'flex-start',
                position: 'relative',
                pr: { md: index < steps.length - 1 ? 2 : 0 },
                cursor: clickable ? 'pointer' : 'default',
                '&:not(:last-of-type)::after': {
                  display: { xs: 'none', md: 'block' },
                  content: '""',
                  position: 'absolute',
                  top: 16,
                  right: 0,
                  width: 'calc(100% - 40px)',
                  ml: 5,
                  borderTop: 2,
                  borderColor: step.state === 'complete' ? 'primary.main' : 'divider',
                  opacity: 0.35,
                  transform: 'translateX(50%)',
                  pointerEvents: 'none',
                },
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  transition: 'all 160ms ease',
                  ...stepCircleSx(step.state, primary),
                }}
              >
                {step.state === 'complete' ? (
                  <CheckCircleIcon sx={{ fontSize: 18 }} />
                ) : (
                  <RadioButtonUncheckedIcon sx={{ fontSize: 16 }} />
                )}
              </Box>
              <Box minWidth={0}>
                <Typography
                  variant="body2"
                  fontWeight={step.state === 'current' ? 700 : 600}
                  color={step.state === 'upcoming' ? 'text.secondary' : 'text.primary'}
                >
                  {step.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.35}>
                  {step.detail}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
