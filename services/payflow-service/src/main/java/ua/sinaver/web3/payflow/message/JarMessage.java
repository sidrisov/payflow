package ua.sinaver.web3.payflow.message;

import lombok.val;
import ua.sinaver.web3.payflow.data.Jar;
import ua.sinaver.web3.payflow.data.User;

public record JarMessage(FlowMessage flow, ProfileMessage profile, String description, String image,
                         String link) {
	public static JarMessage convert(Jar jar, User user) {
		val flow = FlowMessage.convert(jar.getFlow(), user, false);
		val profile = ProfileMessage.convert(user);
		return new JarMessage(flow, profile, jar.getDescription(), jar.getImage(), jar.getLink());
	}
}
