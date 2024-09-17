import { Avatar, Link, LinkProps, Skeleton, Stack, Typography } from '@mui/material';
import { IdentityType } from '../../types/ProfileType';
import { Token } from '../../utils/erc20contracts';
import { useMobile } from '../../utils/hooks/useMobile';
import TokenAvatar from '../avatars/TokenAvatar';
import NetworkAvatar from '../avatars/NetworkAvatar';
import { ActivityIcon } from './ActivityIcon';
import { PaymentType } from '../../types/PaymentType';
import { usePaymentActivityDetails } from '../../utils/hooks/usePaymentAcitivityDetails';

interface PaymentDetailsProps {
  payment: PaymentType;
  identity: IdentityType;
  token?: Token;
  formattedTokenAmount?: string;
  formattedUsdAmount?: string;
  mintData?: any;
}

interface BlockExplorerLinkProps extends Omit<LinkProps, 'href'> {
  blockExplorerUrl: string;
  txHash: string;
  children: React.ReactNode;
}

export const BlockExplorerLink: React.FC<BlockExplorerLinkProps> = ({
  blockExplorerUrl,
  txHash,
  children,
  ...linkProps
}) => {
  return (
    <Link
      href={`${blockExplorerUrl}/tx/${txHash}`}
      target="_blank"
      underline="hover"
      color="inherit"
      overflow="clip"
      textOverflow="ellipsis"
      {...linkProps}>
      {children}
    </Link>
  );
};

export const PaymentDetails = ({ payment, identity }: PaymentDetailsProps) => {
  const isMobile = useMobile();
  const { token, formattedTokenAmount, formattedUsdAmount, defaultBlockExplorerUrl, mintData } =
    usePaymentActivityDetails(payment);

  const renderContent = () => {
    if (payment.category === 'fc_storage') {
      return (
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          flexWrap="wrap"
          sx={{ textWrap: 'balance' }}>
          <Typography variant="caption" fontWeight="bold" fontSize={isMobile ? 12 : 14}>
            {formattedTokenAmount} unit{parseFloat(formattedTokenAmount!) > 1 ? 's' : ''} of
            farcaster storage
          </Typography>
        </Stack>
      );
    }

    if (payment.category === 'mint') {
      if (mintData === undefined) {
        return (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Skeleton variant="rounded" width={25} height={25} />
            <Skeleton variant="text" width={120} />
          </Stack>
        );
      }

      if (mintData) {
        return (
          <Stack direction="row" spacing={1} alignItems="center" useFlexGap>
            <Avatar
              variant="rounded"
              src={mintData.metadata.image}
              sx={{ width: 30, height: 30 }}
            />
            <Typography variant="caption" fontWeight="bold" fontSize={isMobile ? 12 : 14}>
              {mintData.metadata.name}:
              <Typography variant="caption" display="block" color="text.secondary">
                {mintData.collectionName}
              </Typography>
            </Typography>
          </Stack>
        );
      }
    }

    // Default case (for regular payments)
    return (
      <Stack
        direction="row"
        spacing={0.5}
        alignItems="center"
        flexWrap="wrap"
        sx={{ textWrap: 'balance' }}>
        <ActivityIcon identity={identity} payment={payment} />
        <Typography variant="caption" fontWeight="bold" fontSize={isMobile ? 12 : 14}>
          {formattedTokenAmount} {token!.name}
        </Typography>
        <TokenAvatar token={token!} sx={{ width: 15, height: 15 }} />
        <Typography variant="caption" fontWeight="bold" fontSize={isMobile ? 12 : 14}>
          ${formattedUsdAmount}
        </Typography>
        <Typography variant="caption" fontSize={isMobile ? 12 : 14}>
          on
        </Typography>
        <NetworkAvatar chainId={payment.chainId} sx={{ width: 15, height: 15 }} />
      </Stack>
    );
  };

  return defaultBlockExplorerUrl && payment.hash ? (
    <BlockExplorerLink blockExplorerUrl={defaultBlockExplorerUrl} txHash={payment.hash}>
      {renderContent()}
    </BlockExplorerLink>
  ) : (
    renderContent()
  );
};
