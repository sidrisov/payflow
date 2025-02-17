import {
  Button,
  ButtonProps,
  IconButton,
  IconButtonProps,
  Tooltip,
  TooltipProps
} from '@mui/material';
import React from 'react';
import { forwardRef } from 'react';

type ActionButtonProps = {
  icon: React.ReactNode;
  title?: string;
  tooltip?: string;
  tooltipProps?: Partial<TooltipProps>;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
} & (ButtonProps | IconButtonProps);

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ icon, title, tooltip, tooltipProps, onClick, ...props }, ref) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        onClick(event);
      }
    };

    const buttonContent = title ? (
      <Button
        ref={ref}
        variant="contained"
        size="medium"
        startIcon={icon}
        onClick={handleClick}
        {...(props as ButtonProps)}>
        {title}
      </Button>
    ) : (
      <IconButton ref={ref} onClick={handleClick} {...(props as IconButtonProps)}>
        {icon}
      </IconButton>
    );

    if (tooltip) {
      return (
        <Tooltip title={tooltip} {...tooltipProps}>
          <span>{buttonContent}</span>
        </Tooltip>
      );
    }

    return buttonContent;
  }
);
