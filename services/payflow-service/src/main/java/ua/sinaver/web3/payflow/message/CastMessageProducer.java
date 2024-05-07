package ua.sinaver.web3.payflow.message;

import java.util.List;

public class CastMessageProducer {
    public static CastMessage of(WebhookData webhookData) {

        WebhookData.Data data = webhookData.data();

        CastMessage.Profile profile = new CastMessage.Profile(data.author().fid(),
                data.author().custodyAddress(),
                data.author().username(),
                data.author().displayName(),
                data.author().pfpUrl(),
                data.author().verifications());

        CastMessage.ParentProfile parentProfile = new CastMessage.ParentProfile(data.parentAuthor().fid());

        List<CastEmbed> embedList = data.embeds().stream().map(
                embed -> new CastEmbed(embed.toString())).toList();

        List<CastMessage.Profile> mentionedProfiles = data.mentionedProfiles().stream().map(
                webhookProfile -> new CastMessage.Profile(webhookProfile.fid(),
                webhookProfile.custodyAddress(),
                webhookProfile.username(),
                webhookProfile.displayName(),
                webhookProfile.pfpUrl(),
                webhookProfile.verifications())).toList();

        return new CastMessage(data.hash(),
                data.threadHash(),
                data.parentHash(),
                data.parentUrl(),
                data.rootParentUrl(),
                parentProfile,
                profile,
                data.text(),
                embedList,
                data.timestamp(),
                mentionedProfiles);
    }
}
