package ua.sinaver.web3.payflow.message;


import java.util.List;


public record SocialMetadata(String ens, String ensAvatar, List<SocialInfo> socials) {
}
