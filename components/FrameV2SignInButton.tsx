import { Button, ButtonProps } from '@/components/ui/button';
import { useConnect } from 'wagmi';
import { frameWalletV2 } from '@/utils/wagmi';

interface FrameV2SignInButtonProps extends ButtonProps {
  label?: string;
}

export function FrameV2SignInButton({ 
  label = 'Sign in with Frame', 
  ...props 
}: FrameV2SignInButtonProps) {
  const { connect } = useConnect();

  const handleConnect = async () => {
    try {
      await connect({
        connector: frameWalletV2
      });
    } catch (error) {
      console.error('Failed to connect Frame wallet:', error);
    }
  };

  return (
    <Button
      onClick={handleConnect}
      variant="outline"
      {...props}
    >
      {label}
    </Button>
  );
}
