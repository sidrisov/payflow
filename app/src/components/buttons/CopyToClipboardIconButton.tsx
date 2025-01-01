import { IconButton, IconButtonProps, Tooltip } from '@mui/material';
import { copyToClipboard } from '../../utils/copyToClipboard';
import { ContentCopy, Check } from '@mui/icons-material';
import { useState } from 'react';

export default function CopyToClipboardIconButton({
  tooltip,
  value,
  iconSize = 11,
  ...props
}: IconButtonProps & { tooltip: string; value: string | undefined; iconSize?: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (event: React.MouseEvent) => {
    event.stopPropagation();
    copyToClipboard(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Tooltip title={copied ? 'Copied!' : tooltip}>
      <IconButton
        {...props}
        color="inherit"
        sx={{
          width: iconSize + 5,
          height: iconSize + 5,
          color: 'inherit'
        }}
        onClick={handleCopy}>
        {copied ? (
          <Check sx={{ width: iconSize, height: iconSize }} />
        ) : (
          <ContentCopy sx={{ width: iconSize, height: iconSize }} />
        )}
      </IconButton>
    </Tooltip>
  );
}
