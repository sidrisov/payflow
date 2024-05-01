package ua.sinaver.web3.payflow.message;

import ua.sinaver.web3.payflow.data.webhooks.WebhookData;

import java.util.List;

public class CastMessageProducer {
    public static CastMessage of(WebhookData webhookData) {

        CastMessage.Profile profile = new CastMessage.Profile(webhookData.getData().getAuthor().getFid(),
                webhookData.getData().getAuthor().getCustodyAddress(),
                webhookData.getData().getAuthor().getUsername(),
                webhookData.getData().getAuthor().getDisplayName(),
                webhookData.getData().getAuthor().getPfpUrl(),
                webhookData.getData().getAuthor().getVerifications());

        CastMessage.ParentProfile parentProfile = new CastMessage.ParentProfile(webhookData.getData().getParentAuthor().getFid());

        List<CastEmbed> embedList = webhookData.getData().getEmbeds().stream().map(embed -> new CastEmbed(embed.toString())).toList();

        List<CastMessage.Profile> mentionedProfiles = webhookData.getData().getMentionedProfiles().stream().map(webhookProfile -> new CastMessage.Profile(webhookProfile.getFid(), webhookProfile.getCustodyAddress(), webhookProfile.getUsername(), webhookProfile.getDisplayName(), webhookProfile.getPfpUrl(), webhookProfile.getVerifications())).toList();

        return new CastMessage(webhookData.getData().getHash(),
                webhookData.getData().getThreadHash(),
                webhookData.getData().getParentHash(),
                webhookData.getData().getParentUrl(),
                webhookData.getData().getRootParentUrl(),
                parentProfile,
                profile,
                webhookData.getData().getText(),
                embedList,
                webhookData.getData().getTimestamp(),
                mentionedProfiles);
    }
}
