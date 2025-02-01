package ua.sinaver.web3.payflow.service;

import java.util.List;

import lombok.Builder;
import lombok.Value;

@Builder
@Value
public class Message {
	String role;
	List<Content> content;

	@Builder
	@Value
	public static class Content {
		String type;
		String text;
	}
}
