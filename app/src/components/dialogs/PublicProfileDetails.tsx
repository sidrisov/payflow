import { Divider, Stack } from '@mui/material';
import { useContext, useState, useRef, lazy } from 'react';
import { IdentityType } from '@payflow/common';
import { useAccount } from 'wagmi';
import { MoreVert } from '@mui/icons-material';
import { ProfileSection } from '../ProfileSection';
import { Address } from 'viem';
import PaymentDialog, { PaymentSenderType } from '../payment/PaymentDialog';
import { ProfileContext } from '../../contexts/UserContext';
import ChoosePaymentOptionDialog from './ChoosePaymentOptionDialog';
import { AddressSection } from '../AddressSection';
import { ActionButton } from '../buttons/ActionButton';
import { TbSend } from 'react-icons/tb';
import { IdentityMenu } from '../menu/SearchIdenitityMenu';
import { SocialLinksPopover } from './SocialLinksPopover';

export function PublicProfileDetails({
  openPayDialogParam = false,
  identity
}: {
  openPayDialogParam?: boolean;
  identity: IdentityType;
}) {
  const [openPayDialog, setOpenPayDialog] = useState(openPayDialogParam);
  const [openIdentityMenu, setOpenIdentityMenu] = useState(false);
  const identityMenuAnchorRef = useRef<HTMLButtonElement>(null);
  const [openSocialLinksPopover, setOpenSocialLinksPopover] = useState(false);

  const { profile: loggedProfile } = useContext(ProfileContext);

  const { address } = useAccount();

  const [paymentType, setPaymentType] = useState<PaymentSenderType>(
    !loggedProfile ? 'wallet' : 'none'
  );

  console.log('loggedProfile', loggedProfile);

  const handlePayButtonClick = () => setOpenPayDialog(true);
  const handleMoreButtonClick = () => setOpenIdentityMenu(true);
  const handleSocialLinksClick = () => setOpenSocialLinksPopover(true);

  const handlePayDialogClose = async () => {
    setOpenPayDialog(false);
    setPaymentType('none');
  };

  const handleIdentityMenuClose = () => setOpenIdentityMenu(false);
  const handleSocialLinksPopoverClose = () => setOpenSocialLinksPopover(false);

  const ProfileInfo = () =>
    identity?.profile ? (
      <ProfileSection profile={identity.profile} maxWidth={300} />
    ) : (
      identity?.meta && <AddressSection maxWidth={300} identity={identity} />
    );

  return (
    <>
      <Stack width="100%" direction="row" alignItems="center" justifyContent="space-between">
        <ProfileInfo />
        <Stack direction="row" spacing={1}>
          <ActionButton
            icon={<TbSend />}
            title="Pay"
            onClick={handlePayButtonClick}
          />
          <Divider variant="middle" flexItem orientation="vertical" />
          <ActionButton
            ref={identityMenuAnchorRef}
            icon={<MoreVert />}
            onClick={handleMoreButtonClick}
          />
        </Stack>
      </Stack>

      {openPayDialog && paymentType !== 'none' && (
        <>
          <PaymentDialog
            open={openPayDialog}
            paymentType={paymentType}
            sender={{
              type: paymentType === 'payflow' ? 'profile' : 'address',
              identity: {
                address:
                  paymentType === 'payflow'
                    ? (loggedProfile?.identity as Address)
                    : (address?.toLowerCase() as Address),
                ...(paymentType === 'payflow' && {
                  profile: loggedProfile
                })
              }
            }}
            recipient={{
              type: identity.profile ? 'profile' : 'address',
              identity
            }}
            closeStateCallback={handlePayDialogClose}
          />
        </>
      )}

      {paymentType === 'none' && (
        <ChoosePaymentOptionDialog
          open={openPayDialog && Boolean(loggedProfile)}
          setPaymentType={setPaymentType}
          closeStateCallback={handlePayDialogClose}
        />
      )}

      {openIdentityMenu && (
        <IdentityMenu
          open={true}
          identity={identity}
          anchorEl={identityMenuAnchorRef.current}
          currentIdentity
          onClose={handleIdentityMenuClose}
          onClick={handleIdentityMenuClose}
          onSocilLinksClick={handleSocialLinksClick}
        />
      )}

      <SocialLinksPopover
        open={openSocialLinksPopover}
        anchorEl={identityMenuAnchorRef.current}
        onClose={handleSocialLinksPopoverClose}
        identity={identity}
        profile={loggedProfile}
        address={address}
        view={identity.profile ? 'profile' : 'address'}
      />
    </>
  );
}
