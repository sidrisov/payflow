import { Avatar, AvatarProps } from '@mui/material';
import { Token } from '../../utils/erc20contracts';

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
