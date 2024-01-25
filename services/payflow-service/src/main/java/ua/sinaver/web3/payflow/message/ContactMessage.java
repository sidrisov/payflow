package ua.sinaver.web3.payflow.message;

import lombok.val;
import ua.sinaver.web3.payflow.data.Contact;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.graphql.generated.types.SocialDappName;
import ua.sinaver.web3.payflow.graphql.generated.types.Wallet;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public record ContactMessage(
		String address, Boolean favouriteProfile, Boolean favouriteAddress, Boolean invited,
		ProfileMessage profile,
		SocialMetadata meta) {

	public static ContactMessage convert(Contact contact, User profile, Wallet wallet,
	                                     Boolean invited) {
		ProfileMessage profileMessage = null;
		if (profile != null) {
			profileMessage = new ProfileMessage(profile.getDisplayName(),
					profile.getUsername(),
					profile.getProfileImage(),
					profile.getIdentity(),
					null,
					profile.getDefaultFlow() != null ?
							FlowMessage.convert(profile.getDefaultFlow(), profile) : null,
					null,
					-1);
		}


		var xmtp = false;
		String ens = null;
		String ensAvatar = null;
		List<SocialInfo> socials = new ArrayList<>();
		SocialInsights insights = null;

		if (wallet != null) {
			xmtp = wallet.getXmtp() != null && !wallet.getXmtp().isEmpty() && wallet.getXmtp().getFirst().getIsXMTPEnabled();

			if (wallet.getPrimaryDomain() != null) {
				ens = wallet.getPrimaryDomain().getName();
				if (wallet.getPrimaryDomain().getTokenNft() != null) {

					if (wallet.getPrimaryDomain().getTokenNft().getContentValue() != null
							&& wallet.getPrimaryDomain().getTokenNft().getContentValue().getImage() != null)
						ensAvatar =
								wallet.getPrimaryDomain().getTokenNft().getContentValue().getImage().getSmall();
				}
			} else if (wallet.getDomains() != null && !wallet.getDomains().isEmpty()) {
				ens = wallet.getDomains().getFirst().getName();
			}


			socials = getSocials(wallet);
			insights = getWalletInsights(wallet);

			if (ensAvatar == null && socials != null && !socials.isEmpty()) {
				ensAvatar = socials.getFirst().profileImage();
			}
		}

		val meta = new SocialMetadata(xmtp, ens, ensAvatar, socials, insights);

		return new ContactMessage(contact.getIdentity(), contact.isProfileChecked(),
				contact.isAddressChecked(), invited, profileMessage, meta);
	}


	private static SocialInsights getWalletInsights(Wallet wallet) {
		var sentTxs = 0;
		String farcasterFollow = null;
		String lensFollow = null;

		if (wallet.getTokenTransfers() != null && !wallet.getTokenTransfers().isEmpty()) {
			sentTxs = wallet.getTokenTransfers().size();
		}

		val socialFollowers = wallet.getSocialFollowers();
		val socialFollowings = wallet.getSocialFollowings();
		if (socialFollowers != null && socialFollowings != null
				&& socialFollowings.getFollowing() != null) {

			if (socialFollowings.getFollowing().stream()
					.anyMatch(f -> f.getDappName().equals(SocialDappName.farcaster.toString()))) {

				if (socialFollowers.getFollower() != null && socialFollowers.getFollower().stream()
						.anyMatch(f -> f.getDappName().equals(SocialDappName.farcaster.toString()))) {
					farcasterFollow = "mutual";
				} else {
					farcasterFollow = "following";
				}
			}

			if (socialFollowings.getFollowing().stream()
					.anyMatch(f -> f.getDappName().equals(SocialDappName.lens.toString()))) {

				if (socialFollowers.getFollower() != null && socialFollowers.getFollower().stream()
						.anyMatch(f -> f.getDappName().equals(SocialDappName.lens.toString()))) {
					lensFollow = "mutual";
				} else {
					lensFollow = "following";
				}
			}
		}

		return new SocialInsights(farcasterFollow, lensFollow, sentTxs);
	}

	private static List<SocialInfo> getSocials(Wallet wallet) {
		if (wallet.getSocials() != null) {
			return wallet.getSocials().stream()
					.filter(s -> s.getDappName() != null && s.getProfileName() != null)
					.map(s -> {

						String profileImage;
						if (s.getProfileImageContentValue() != null && s.getProfileImageContentValue().getImage() != null && s.getProfileImageContentValue().getImage().getSmall() != null) {
							profileImage = s.getProfileImageContentValue().getImage().getSmall();
						} else {
							profileImage = s.getProfileImage();
						}

						return new SocialInfo(s.getDappName().name(), s.getProfileName(),
								s.getProfileDisplayName(), profileImage, s.getFollowerCount());
					}).collect(Collectors.toList());
		} else {
			return Collections.emptyList();
		}
	}
}