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
      maxRows={3}
      helperText={comment.length > 0 ? `${comment.length}/32` : undefined}
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
        },
        htmlInput: {
          maxLength: 32
        },
        formHelperText: {
          sx: {
            textAlign: 'right',
            margin: 0
          }
        }
      }}
      sx={{
        maxWidth: comment.length > 0 ? 200 : 130,
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
    />
  );
};
