import { Avatar, AvatarProps } from '@mui/material';

export default function TokenAvatar({
  tokenName,
  ...props
}: AvatarProps & {
  tokenName: string;
}) {
  const { sx: sxProps, ...restProps } = props;

  return (
    <Avatar
      {...restProps}
      src={`/coins/${tokenName.toLowerCase()}.png`}
      sx={{
        ...sxProps
      }}
    />
  );
}
