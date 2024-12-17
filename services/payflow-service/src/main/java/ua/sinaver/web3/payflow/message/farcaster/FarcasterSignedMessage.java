package ua.sinaver.web3.payflow.message.farcaster;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public record FarcasterSignedMessage(
		String header,
		String payload,
		String signature) {

	public enum HeaderType {
		@JsonProperty("custody")
		CUSTODY,
		@JsonProperty("app-key")
		APP_KEY
	}

	public record Header(
			String fid,
			HeaderType type,
			String key) {
	}

	/*
	 * @Slf4j
	 * public static class Base64JsonDeserializer extends
	 * StdDeserializer<DecodedHeader> {
	 * public Base64JsonDeserializer() {
	 * super(DecodedHeader.class);
	 * }
	 *
	 * @Override
	 * public DecodedHeader deserialize(JsonParser p, DeserializationContext ctxt) {
	 * try {
	 * val value = p.getValueAsString();
	 * log.trace("Received Base64 value: {}", value);
	 *
	 * val decoded = Base64.getUrlDecoder().decode(value);
	 * val jsonStr = new String(decoded, StandardCharsets.UTF_8);
	 * log.trace("Decoded JSON string: {}", jsonStr);
	 *
	 * val jsonParser = p.getCodec().getFactory().createParser(jsonStr);
	 * jsonParser.nextToken();
	 *
	 * val result = p.getCodec().readValue(jsonParser, DecodedHeader.class);
	 * log.trace("Successfully parsed value: {}", result);
	 *
	 * return result;
	 * } catch (Exception e) {
	 * log.error("Failed to decode/parse Base64 JSON", e);
	 * throw new RuntimeException("Error decoding Base64URL JSON", e);
	 * }
	 * }
	 * }
	 */
}
