package ua.sinaver.web3.payflow.utils;

public class AddressUtils {
	public static String shortedWalletAddress(String address) {
		// Extract the first 4 characters
		String prefix = address.substring(0, 5);
		// Extract the last 4 characters
		String suffix = address.substring(address.length() - 3);

		// Combine the prefix, ellipsis, and suffix
		return prefix + "..." + suffix;
	}
}
