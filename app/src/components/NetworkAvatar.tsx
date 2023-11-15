import { Avatar, AvatarProps, Tooltip } from '@mui/material';
import getNetworkImageSrc, { getNetworkDisplayName } from '../utils/networkImages';

export default function NetworkAvatar(
  props: AvatarProps & {
    network: string | number;
    tooltip?: boolean;
  }
) {
  const { network, tooltip } = props;
  const imageSrc = getNetworkImageSrc(network);
  const title = tooltip ? getNetworkDisplayName(network) : '';

  return tooltip ? (
    <Tooltip title={title}>
      <Avatar {...props} title="asdfasdfsad" src={imageSrc} />
    </Tooltip>
  ) : (
    <Avatar {...props} src={imageSrc} />
  );
}
