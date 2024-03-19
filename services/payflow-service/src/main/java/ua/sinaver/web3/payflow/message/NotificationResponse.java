package ua.sinaver.web3.payflow.message;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Date;
import java.util.List;

public record NotificationResponse(List<Notification> notifications, Next next) {
	public record Notification(
			@JsonProperty("most_recent_timestamp") Date mostRecentTimestamp,
			String type,
			CastMessage cast) {
	}

	public record Next(String cursor) {
	}
}
