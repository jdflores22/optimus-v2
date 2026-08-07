import { ReactNode } from 'react';
import { Box, Table, TableProps } from '@mui/material';
import { tableScrollSx } from './responsiveLayout';

type ResponsiveTableProps = TableProps & {
  children: ReactNode;
  minWidth?: number;
};

export function ResponsiveTable({ children, minWidth = 560, sx, ...tableProps }: ResponsiveTableProps) {
  return (
    <Box
      sx={{
        ...tableScrollSx,
        '& table, & .MuiTable-root': { minWidth },
      }}
    >
      <Table sx={sx} {...tableProps}>
        {children}
      </Table>
    </Box>
  );
}
