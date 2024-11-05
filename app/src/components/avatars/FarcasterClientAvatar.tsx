import { Avatar, type SxProps } from '@mui/material';

interface FarcasterClientAvatarProps {
  image: string;
  name: string;
  sx?: SxProps;
}
export function FarcasterClientAvatar({ image, name, sx }: FarcasterClientAvatarProps) {
  return (
    <Avatar
      src={image}
      alt={`${name} logo`}
      sx={{
        width: 36,
        height: 36,
        borderRadius: 3,
        ...sx
      }}
    />
  );
} 
