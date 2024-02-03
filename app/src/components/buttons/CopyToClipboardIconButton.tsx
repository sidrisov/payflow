import { IconButton, IconButtonProps, Tooltip } from '@mui/material';
import { copyToClipboard } from '../../utils/copyToClipboard';
import { toast } from 'react-toastify';
import { ContentCopy } from '@mui/icons-material';

export default function CopyToClipboardIconButton({
  tooltip,
  value,
  ...props
}: IconButtonProps & { tooltip: string; value: string | undefined }) {
  return (
    <Tooltip title={tooltip}>
      <IconButton
        {...props}
        size="small"
        onClick={() => {
          copyToClipboard(value);
          toast.success('Copied!');
        }}>
        <ContentCopy fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
