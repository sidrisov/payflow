import { useEffect, useState } from 'react';
import { SocialInfoType } from '@payflow/common';
import { useIdentity } from '@/utils/queries/profiles';

export const useFarcasterSocial = (identity?: string, fid?: string) => {
  const [social, setSocial] = useState<SocialInfoType>();
  const { isLoading, data: userIdentity } = useIdentity(identity, fid);

  useEffect(() => {
    const farcasterSocial = userIdentity?.meta?.socials.find((s) => s.dappName === 'farcaster');
    if (farcasterSocial) {
      setSocial(farcasterSocial);
    }
  }, [userIdentity]);

  return { social, isLoading };
};
