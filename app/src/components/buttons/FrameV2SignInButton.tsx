import { Avatar, Button } from '@mui/material';
import { ButtonProps } from '@mui/material';

import FrameV2SDK from '@farcaster/frame-sdk';
import { SignInResult } from '@farcaster/frame-core/dist/actions/signIn';
import { Address } from 'viem';
import FarcasterAvatar from '../avatars/FarcasterAvatar';
import LoadingButton from '@mui/lab/LoadingButton';
import { useCallback, useEffect, useState } from 'react';

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
  const [loading, setLoading] = useState(false);

  const signIn = useCallback(async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, [nonce, onError, onSuccess]);

  useEffect(() => {
    if (!loading) {
      signIn();
    }
  }, [loading, signIn]);

  return (
    <LoadingButton
      onClick={signIn}
      loading={loading}
      startIcon={!loading && <FarcasterAvatar size={28} />}
      variant="text"
      color="inherit"
      sx={{
        '&:hover': {
          backgroundColor: 'action.hover'
        },
        borderRadius: 3,
        width: '100%',
        height: 47,
        textTransform: 'none',
        fontWeight: 'bold',
        fontSize: 18,
        border: 1,
        borderColor: 'divider'
      }}
      {...props}>
      Farcaster
    </LoadingButton>
  );
}
