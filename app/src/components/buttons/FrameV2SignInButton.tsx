import { Button } from '@mui/material';
import { ButtonProps } from '@mui/material';

import FrameV2SDK from '@farcaster/frame-sdk';
import { SignInResult } from '@farcaster/frame-core/dist/actions/signIn';
import { Address } from 'viem';

export type FrameV2SignInError = Error;

export interface FrameV2AuthResponse extends SignInResult {
  username?: string;
  fid?: number;
  verifications?: Address[];
}

interface FrameV2SignInButtonProps extends Omit<ButtonProps, 'onError'> {
  nonce: string;
  onSuccess: (result: FrameV2AuthResponse) => void;
  onError: (error: Error) => void;
}

export function FrameV2SignInButton({
  nonce,
  onSuccess,
  onError,
  ...props
}: FrameV2SignInButtonProps) {
  const handleConnect = async () => {
    try {
      const result = await FrameV2SDK.actions.signIn({
        nonce
      });
      const user = (await FrameV2SDK.context).user;
      onSuccess({
        ...result,
        username: user.username,
        fid: user.fid
      });
    } catch (error) {
      onError(error as FrameV2SignInError);
    }
  };

  return (
    <Button
      onClick={handleConnect}
      sx={{
        backgroundColor: '#8A63D2',
        '&:hover': {
          backgroundColor: '#7142D2'
        },
        borderRadius: 3
      }}
      {...props}>
      Sign In with Farcaster
    </Button>
  );
}
