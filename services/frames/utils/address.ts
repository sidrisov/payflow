export function shortenWalletAddressLabel(walletAddress: string | undefined) {
  if (walletAddress) {
    return walletAddress.slice(0, 5) + '...' + walletAddress.slice(walletAddress.length - 3);
  } else {
    return '';
  }
}

export function shortenWalletAddressLabel2(walletAddress: string | undefined) {
  if (walletAddress) {
    return walletAddress.slice(0, 6) + '...' + walletAddress.slice(walletAddress.length - 4);
  } else {
    return '';
  }
}
