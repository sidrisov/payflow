import { Button, ButtonProps } from '@mui/material';

export default function CastActionButton({
  title,
  description,
  installUrl,
  ...props
}: ButtonProps & {
  title: string;
  description?: string;
  installUrl?: string;
}) {
  return (
    <Button
      variant="outlined"
      color="inherit"
      fullWidth
      sx={{
        textTransform: 'none',
        borderRadius: 5,
        flex: 'display',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'start'
      }}
      {...(installUrl && { href: installUrl, target: '_blank' })}
      {...props}>
      {title}
    </Button>
  );
}
