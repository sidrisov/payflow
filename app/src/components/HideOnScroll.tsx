import { useScrollTrigger, Slide } from '@mui/material';

export default function HideOnScroll(props: any) {
  const { children } = props;

  // Adjust the threshold here; e.g., 35 pixels from the top
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 35
  });

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}
