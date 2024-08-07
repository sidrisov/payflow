import { Slide } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import React, { forwardRef, ReactElement } from 'react';

export const UpSlideTransition = forwardRef(function Transition(
  props: TransitionProps & {
    children: ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});
