package ua.sinaver.web3.payflow.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import ua.sinaver.web3.payflow.message.farcaster.CastConversationData;
import ua.sinaver.web3.payflow.message.farcaster.FarcasterUser;
import ua.sinaver.web3.payflow.message.farcaster.FarcasterUserResponse;
import ua.sinaver.web3.payflow.message.subscription.SubscribedToResponse;

import java.util.List;
import java.util.Map;

@FeignClient(name = "neynar", url = "https://api.neynar.com/v2/farcaster", configuration = NeynarClientConfig.class)
public interface NeynarClient {
    @GetMapping("/cast/conversation")
    CastConversationData getCastConversation(
            @RequestParam String identifier,
            @RequestParam String type,
            @RequestParam(value = "reply_depth") Integer replyDepth,
            @RequestParam(value = "include_chronological_parent_casts") Boolean includeParentCasts,
            @RequestParam Integer limit);

    default CastConversationData getCastConversationByHash(String hash) {
        return getCastConversation(hash, "hash", 0, true, 20);
    }

    @GetMapping("/user/subscribed_to")
    SubscribedToResponse getSubscribedTo(
            @RequestParam Integer fid,
            @RequestParam(name = "subscription_provider") String subscriptionProvider);

    default SubscribedToResponse getSubscribedTo(Integer fid) {
        return getSubscribedTo(fid, "fabric_stp");
    }

    @GetMapping("/user/bulk-by-address")
    Map<String, List<FarcasterUser>> getUsersByAddresses(@RequestParam String addresses);

    @GetMapping("/user/by_username")
    FarcasterUserResponse getUserByUsername(@RequestParam String username);

    default Map<String, List<FarcasterUser>> getUsersByAddresses(List<String> addresses) {
        return getUsersByAddresses(String.join(",", addresses));
    }
}
