import { ReactNode } from 'react';
import { Box, InputAdornment, TextField, TextFieldProps } from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';

/** Single-row admin filters — use inside a table section instead of a separate card. */
export function AdminFilterBar({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1,
        mb: 1.5,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          md: 'minmax(160px, 1.6fr) repeat(auto-fit, minmax(128px, 1fr))',
        },
        alignItems: 'center',
      }}
    >
      {children}
    </Box>
  );
}

export const adminFilterFieldProps: Pick<TextFieldProps, 'size' | 'fullWidth' | 'margin'> = {
  size: 'small',
  fullWidth: true,
  margin: 'none',
};

type AdminSearchFieldProps = Omit<TextFieldProps, 'size'> & {
  value: string;
  onValueChange: (value: string) => void;
};

export function AdminSearchField({
  value,
  onValueChange,
  placeholder = 'Search…',
  ...rest
}: AdminSearchFieldProps) {
  return (
    <TextField
      {...adminFilterFieldProps}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchOutlinedIcon fontSize="small" color="action" />
          </InputAdornment>
        ),
      }}
      {...rest}
    />
  );
}

export function AdminSelectField(props: TextFieldProps) {
  return <TextField select {...adminFilterFieldProps} {...props} />;
}
