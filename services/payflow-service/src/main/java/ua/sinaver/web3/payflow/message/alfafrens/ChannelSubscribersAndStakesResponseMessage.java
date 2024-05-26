package ua.sinaver.web3.payflow.message.alfafrens;

import java.util.List;

public record ChannelSubscribersAndStakesResponseMessage(
		String id,
		int numberOfSubscribers,
		int numberOfStakers,
		String totalSubscriptionFlowRate,
		String totalSubscriptionInflowAmount,
		String totalClaimed,
		String owner,
		String currentStaked,
		List<Member> members,
		String title,
		String bio,
		boolean hasMore
) {
	public record Member(
			String id,
			long lastUpdatedTimestamp,
			Subscriber subscriber,
			Channel channel,
			boolean isSubscribed,
			boolean isStaked,
			String currentStaked,
			String totalSubscriptionOutflowRate,
			String totalSubscriptionOutflowAmount,
			String estimatedTotalCashbackFlowRate,
			String estimatedTotalCashbackAmount,
			String fid
	) {
		public record Subscriber(String id) {
		}

		public record Channel(String id, String owner) {
		}
	}
}

