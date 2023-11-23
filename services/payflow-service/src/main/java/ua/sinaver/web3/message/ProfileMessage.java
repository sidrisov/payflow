package ua.sinaver.web3.message;

import java.util.List;

public record ProfileMessage(String displayName, String username, String profileImage, String address,
        FlowMessage defaultFlow, List<FlowMessage> flows, int identityInviteLimit) {
}
