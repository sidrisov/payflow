import { Avatar, AvatarProps } from '@mui/material';
import { Token } from '@payflow/common';

export default function TokenAvatar({
  token,
  ...props
}: AvatarProps & {
  token: Token;
}) {
  const { sx: sxProps, ...restProps } = props;

  return (
    <Avatar
      {...restProps}
      src={token?.imageURL ?? `/coins/${token?.id}.png`}
      sx={{
        ...sxProps
      }}
    />
  );
}
