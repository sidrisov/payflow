import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

export const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }}/>
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    width: 300,
    maxHeight: 375,
    borderRadius: 20,
    padding: 8,
    paddingBottom: 16,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 'calc(100% - 32px)',
    fontSize: theme.typography.pxToRem(12),
    border: '1px solid #dadde9',
    boxShadow: 'box-shadow: 0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)',
  },
}));
