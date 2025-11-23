import { ButtonProps } from '@mui/material';

import { sdk } from '@farcaster/miniapp-sdk';
import { Address } from 'viem';
import FarcasterAvatar from '../avatars/FarcasterAvatar';
import LoadingButton from '@mui/lab/LoadingButton';
import { useCallback, useEffect, useState } from 'react';

export type FrameV2SignInError = Error;

// Define SignInResult based on the SDK response
export interface SignInResult {
  message: string;
  signature: `0x${string}`;
  fid: number;
  username?: string;
  bio?: string;
  displayName?: string;
  pfpUrl?: string;
  authMethod: 'custody' | 'authAddress';
}

export interface FrameV2AuthResponse extends Omit<SignInResult, 'fid' | 'username'> {
  username?: string;
  fid: number;
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
      const result = await sdk.actions.signIn({
        nonce
      });
      const user = (await sdk.context).user;
      onSuccess({
        ...result,
        signature: result.signature as `0x${string}`,
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
