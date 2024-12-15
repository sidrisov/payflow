import { IconButton, IconButtonProps, Tooltip } from '@mui/material';
import { copyToClipboard } from '../../utils/copyToClipboard';
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
        color="inherit"
        sx={{ width: iconSize + 5, height: iconSize + 5 }}
        onClick={(event) => {
          event.stopPropagation();
          copyToClipboard(value);
        }}>
        <ContentCopy sx={{ width: iconSize, height: iconSize }} />
      </IconButton>
    </Tooltip>
  );
}
