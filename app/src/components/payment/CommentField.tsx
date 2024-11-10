import { TextField } from '@mui/material';
import { TbMessagePlus } from 'react-icons/tb';

type CommentFieldProps = {
  disabled?: boolean;
  comment: string;
  setComment: React.Dispatch<React.SetStateAction<string>>;
};

export const CommentField: React.FC<CommentFieldProps> = ({
  disabled = false,
  comment,
  setComment
}) => {
  return (
    <TextField
      disabled={disabled}
      variant="standard"
      size="small"
      placeholder="Add a comment"
      value={comment}
      onChange={(e) => setComment(e.target.value)}
      multiline
      maxRows={2}
      sx={{
        '& .MuiInput-root': {
          fontSize: 14,
          height: 'auto',
          '&:before': {
            borderBottom: 'none'
          },
          '&:after': {
            borderBottom: 'none'
          },
          '&:hover:not(.Mui-disabled):before': {
            borderBottom: 'none'
          }
        },
        '& .MuiInputBase-input': {
          padding: '4px',
          '&::placeholder': {
            color: 'text.secondary',
            opacity: 0.8
          }
        }
      }}
      slotProps={{
        input: {
          startAdornment: (
            <TbMessagePlus
              size={18}
              style={{
                marginRight: 4,
                color: 'inherit',
                opacity: 0.8
              }}
            />
          )
          /* endAdornment: (
            <Tooltip
              title={
                zoraCommentEnabled
                  ? 'Comment will be added to payflow and zora.co'
                  : 'Comment will be added only to payflow'
              }
              arrow
              open={isMobile ? showTooltip : undefined}
              disableFocusListener={isMobile}
              disableHoverListener={isMobile}
              disableTouchListener={isMobile}>
              <IconButton
                disabled={disabled}
                size="small"
                onClick={() => isMobile && setShowTooltip(!showTooltip)}
                sx={{ color: 'text.secondary' }}>
                <InfoOutlined fontSize="inherit" />
              </IconButton>
            </Tooltip>
          ) */
        }
      }}
    />
  );
};
