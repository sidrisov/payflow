import {
  CardProps,
  Card,
  CardHeader,
  CardContent,
  Stack,
  StackProps,
  Typography,
  Box
} from '@mui/material';

export default function InfoCard({
  title,
  children,
  rightComponent,
  ...props
}: CardProps & {
  title: string;
  rightComponent?: React.ReactNode;
}) {
  return (
    <Card
      elevation={12}
      sx={{
        mt: 2,
        p: 1,
        borderRadius: '25px',
        width: '100%'
      }}
      {...props}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography fontSize={18} fontWeight="bold">
              {title}
            </Typography>
            {rightComponent && <Box sx={{ ml: 1 }}>{rightComponent}</Box>}
          </Box>
        }
        sx={{ py: 0.5, px: 1 }}
      />
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          gap: 1,
          '&:last-child': {
            padding: 0.5
          }
        }}>
        {children}
      </CardContent>
    </Card>
  );
}

export function InfoStack({ title, children, ...props }: StackProps & { title: string }) {
  return (
    <Stack
      p={1}
      spacing={1}
      minHeight={70}
      sx={{
        border: 1,
        borderRadius: 5,
        borderColor: 'divider',
        alignItems: 'center'
      }}
      {...props}>
      <Typography fontSize={12} fontWeight="bold" color="text.secondary" textTransform="uppercase">
        {title}
      </Typography>
      {children}
    </Stack>
  );
}
