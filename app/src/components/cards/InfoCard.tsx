import {
  CardProps,
  Card,
  CardHeader,
  CardContent,
  Stack,
  StackProps,
  Typography,
  useMediaQuery
} from '@mui/material';
import { grey } from '@mui/material/colors';

export default function InfoCard({ title, children, ...props }: CardProps & { title: string }) {
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
        title={title}
        titleTypographyProps={{
          fontSize: 20,
          fontWeight: 'bold',
          textAlign: 'center'
        }}
        sx={{ p: 0, pb: 0.5 }}
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
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
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
      <Typography
        fontSize={12}
        fontWeight="bold"
        color={grey[prefersDarkMode ? 400 : 700]}
        textTransform="uppercase">
        {title}
      </Typography>
      {children}
    </Stack>
  );
}
