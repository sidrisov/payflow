import * as React from 'react';
import { ProfileType } from '../../types/ProfleType.ts';
import { TooltipProps } from '@mui/material';
import { HtmlTooltip } from './HtmlTooltip.tsx';
import { PublicProfileDetails } from '../dialogs/PublicProfileDetails.tsx';

export function PublicProfileDetailsTooltip({ profile, ...props }: { profile: ProfileType } & Omit<TooltipProps, 'title'>) {
  return (
    <HtmlTooltip
      {...props}
      title={
        <React.Fragment>
          <PublicProfileDetails profile={profile} />
        </React.Fragment>
      }
    />
  );
}
