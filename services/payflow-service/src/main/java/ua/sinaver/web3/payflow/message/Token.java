package ua.sinaver.web3.payflow.message;

public record Token(
		String id,
		String name,
		String chain,
		Integer chainId,
		Integer decimals,
		String tokenAddress,
		String description,
		String imageURL,
		UnderlyingToken underlyingToken) {
	public record UnderlyingToken(
			String id,
			String name,
			String tokenAddress) {
	}

	public static Token of(String tokenAddress, String chain, Integer chainId) {
		return new Token("unknown", "Unknown", chain, chainId, 18, tokenAddress, null, null, null);
	}
}
