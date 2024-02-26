import { IconButton, IconButtonProps, Tooltip } from '@mui/material';
import { copyToClipboard } from '../../utils/copyToClipboard';
import { toast } from 'react-toastify';
import { ContentCopy } from '@mui/icons-material';

export default function CopyToClipboardIconButton({
  tooltip,
  value,
  iconSize = 11,
  ...props
}: IconButtonProps & { tooltip: string; value: string | undefined; iconSize?: number }) {
  return (
    <Tooltip title={tooltip}>
      <IconButton
        {...props}
        sx={{ width: iconSize + 5, height: iconSize + 5 }}
        onClick={(event) => {
          event.stopPropagation();
          copyToClipboard(value);
          toast.success('Copied!');
        }}>
        <ContentCopy sx={{ width: iconSize, height: iconSize }} />
      </IconButton>
    </Tooltip>
  );
}
