package ua.sinaver.web3.payflow.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import ua.sinaver.web3.payflow.message.farcaster.CastConversationData;

@FeignClient(name = "neynar", url = "https://api.neynar.com/v2/farcaster", configuration = NeynarClientConfig.class)
public interface NeynarClient {
    @GetMapping("/cast/conversation")
    CastConversationData getCastConversation(
            @RequestParam String identifier,
            @RequestParam String type,
            @RequestParam(value = "reply_depth") Integer replyDepth,
            @RequestParam(value = "include_chronological_parent_casts") Boolean includeParentCasts,
            @RequestParam Integer limit);

    @GetMapping("/cast/conversation")
    default CastConversationData getCastConversationByHash(String identifier) {
        return getCastConversation(identifier, "hash", 1, true, 5);
    }
}
