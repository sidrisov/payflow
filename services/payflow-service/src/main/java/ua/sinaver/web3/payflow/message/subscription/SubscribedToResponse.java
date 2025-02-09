package ua.sinaver.web3.payflow.message.subscription;

import java.util.List;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public record SubscribedToResponse(
        List<Subscription> subscribedTo) {
}
