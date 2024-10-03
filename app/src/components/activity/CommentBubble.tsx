import { Typography } from '@mui/material';
import { useMobile } from '../../utils/hooks/useMobile';

export const CommentBubble = ({ comment }: { comment: string }) => {
  const isMobile = useMobile();
  return (
    <Typography
      variant="caption"
      fontWeight="bold"
      fontSize={isMobile ? 12 : 14}
      sx={{
        wordBreak: 'break-all',
        width: 'fit-content'
      }}>
      <span style={{ fontSize: 18, verticalAlign: 'middle' }}>💬</span> {comment}
    </Typography>
  );
};
