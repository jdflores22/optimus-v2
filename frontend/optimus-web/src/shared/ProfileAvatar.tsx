import { Avatar, type AvatarProps } from '@mui/material';
import { profilePhotoNeedsWhiteBackground } from './profilePhotoUtils';

type ProfileAvatarProps = AvatarProps & {
  photoPath?: string | null;
  photoMimeType?: string | null;
};

export function ProfileAvatar({
  src,
  photoPath,
  photoMimeType,
  sx,
  children,
  ...props
}: ProfileAvatarProps) {
  const needsWhiteBg =
    Boolean(src) &&
    (profilePhotoNeedsWhiteBackground(photoMimeType) ||
      profilePhotoNeedsWhiteBackground(photoPath) ||
      profilePhotoNeedsWhiteBackground(typeof src === 'string' ? src : null));

  return (
    <Avatar
      src={src}
      sx={{
        bgcolor: src ? (needsWhiteBg ? '#ffffff' : 'transparent') : 'primary.main',
        color: src && needsWhiteBg ? 'text.primary' : undefined,
        '& img': src
          ? {
              objectFit: 'cover',
              backgroundColor: needsWhiteBg ? '#ffffff' : undefined,
            }
          : undefined,
        ...sx,
      }}
      {...props}
    >
      {children}
    </Avatar>
  );
}
