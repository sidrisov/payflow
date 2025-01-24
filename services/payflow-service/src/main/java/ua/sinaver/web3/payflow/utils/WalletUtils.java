package ua.sinaver.web3.payflow.utils;

public class WalletUtils {
	public static String shortenWalletAddressLabel2(String walletAddress) {
		if (walletAddress != null && !walletAddress.isEmpty()) {
			return walletAddress.substring(0, 6) + "..." + walletAddress.substring(walletAddress.length() - 4);
		} else {
			return "";
		}
	}
}
