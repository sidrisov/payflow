package ua.sinaver.web3.payflow.message.subscription;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.util.List;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record SubscriptionsCreatedMessage(
		List<Subscription> subscriptionsCreated) {
}
