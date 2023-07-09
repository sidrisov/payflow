export function shortenWalletAddressLabel(walletAddress: string | undefined) {
  if (walletAddress) {
    return walletAddress.slice(0, 5) + '...' + walletAddress.slice(walletAddress.length - 3);
  } else {
    return '';
  }
}
