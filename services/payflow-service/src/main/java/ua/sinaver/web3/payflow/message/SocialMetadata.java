package ua.sinaver.web3.payflow.message;


import java.util.List;


public record SocialMetadata(boolean xmtp, String ens, String ensAvatar, List<SocialInfo> socials,
                             SocialInsights insights) {
}
