import type { SxProps, Theme } from '@mui/material/styles';

/** 4-up metric row: 2 columns on phone, 4 on tablet+. */
export const metricGrid4Sx: SxProps<Theme> = {
  display: 'grid',
  gap: 1,
  gridTemplateColumns: {
    xs: 'repeat(2, minmax(0, 1fr))',
    sm: 'repeat(4, minmax(0, 1fr))',
  },
};

/** Horizontal scroll for wide tables on small screens. */
export const tableScrollSx: SxProps<Theme> = {
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
  mx: { xs: -1.5, sm: 0 },
  px: { xs: 1.5, sm: 0 },
  '& table, & .MuiTable-root': {
    minWidth: 560,
  },
};

/** Dialog / form footer buttons: stack on phone, row on tablet+. */
export const dialogActionsSx: SxProps<Theme> = {
  px: 3,
  py: 2,
  flexWrap: 'wrap',
  gap: 1,
  '& > .MuiButton-root': {
    width: { xs: '100%', sm: 'auto' },
    m: 0,
  },
};

/** Inline form field + button row. */
export const formRowStackProps = {
  direction: { xs: 'column' as const, sm: 'row' as const },
  flexWrap: 'wrap' as const,
  useFlexGap: true,
  spacing: 2,
  alignItems: { xs: 'stretch' as const, sm: 'center' as const },
  sx: {
    '& > .MuiButton-root': { width: { xs: '100%', sm: 'auto' } },
    '& > .MuiTextField-root': { flex: { sm: '1 1 auto' }, minWidth: { sm: 120 } },
  },
};

/** Page header actions: stack on phone, row on tablet+. */
export const pageActionsStackProps = {
  direction: { xs: 'column' as const, sm: 'row' as const },
  flexWrap: 'wrap' as const,
  useFlexGap: true,
  spacing: 1,
  alignItems: { xs: 'stretch' as const, sm: 'center' as const },
  sx: {
    width: { xs: '100%', sm: 'auto' },
    '& > .MuiButton-root, & > .MuiButtonBase-root': {
      width: { xs: '100%', sm: 'auto' },
    },
  },
};
