package ua.sinaver.web3.payflow.message;

import lombok.val;
import org.apache.commons.lang3.BooleanUtils;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.graphql.generated.types.SocialDappName;
import ua.sinaver.web3.payflow.graphql.generated.types.Wallet;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public record IdentityMessage(
		String address, Boolean invited,
		ProfileMessage profile,
		SocialMetadata meta) {

	private static final int PAYFLOW_SCORE = 10;
	private static final int ENS_SCORE = 5;
	private static final int FARCASTER_SCORE = 4;
	private static final int LENS_SCORE = 4;
	private static final int XMTP_SCORE = 2;

	public static ProfileMessage convert(User profile) {
		if (profile != null && profile.isAllowed()) {
			return new ProfileMessage(profile.getDisplayName(),
					profile.getUsername(),
					profile.getProfileImage(),
					profile.getIdentity(),
					null,
					profile.getDefaultFlow() != null ?
							FlowMessage.convert(profile.getDefaultFlow(), profile, false) : null,
					null,
					-1);
		} else {
			return null;
		}
	}

	public static IdentityMessage convert(String identity, User profile, Wallet walletSocials,
	                                      Wallet walletInsights,
	                                      Boolean invited) {
		val profileMessage = convert(profile);

		var xmtp = false;
		String ens = null;
		String ensAvatar = null;
		List<SocialInfo> socials = new ArrayList<>();
		SocialInsights insights = null;

		if (walletSocials != null) {
			xmtp = walletSocials.getXmtp() != null && !walletSocials.getXmtp().isEmpty() && walletSocials.getXmtp().getFirst().getIsXMTPEnabled();

			if (walletSocials.getPrimaryDomain() != null) {
				ens = walletSocials.getPrimaryDomain().getName();
				if (walletSocials.getPrimaryDomain().getTokenNft() != null) {
					if (walletSocials.getPrimaryDomain().getTokenNft().getContentValue() != null
							&& walletSocials.getPrimaryDomain().getTokenNft().getContentValue().getImage() != null)
						ensAvatar =
								walletSocials.getPrimaryDomain().getTokenNft().getContentValue().getImage().getSmall();
				}
			} else if (walletSocials.getDomains() != null && !walletSocials.getDomains().isEmpty()) {
				ens = walletSocials.getDomains().getFirst().getName();
			}


			socials = getSocials(walletSocials);
			insights = walletInsights != null ? getWalletInsights(walletInsights) : null;

			if (ensAvatar == null && socials != null && !socials.isEmpty()) {
				ensAvatar = socials.getFirst().profileImage();
			}
		}

		val meta = new SocialMetadata(xmtp, ens, ensAvatar, socials, insights);

		return new IdentityMessage(identity, invited, profileMessage, meta);
	}

	public static SocialInsights getWalletInsights(Wallet wallet) {
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
								s.getProfileDisplayName(), s.getUserId(),
								profileImage, s.getFollowerCount(),
								BooleanUtils.isTrue(s.getIsFarcasterPowerUser()));
					}).collect(Collectors.toList());
		} else {
			return Collections.emptyList();
		}
	}

	public int score() {
		var score = 0;
		if (this.profile != null) {
			score += PAYFLOW_SCORE;
		}

		val meta = this.meta();
		if (meta != null) {
			if (meta.ens() != null) {
				score += ENS_SCORE;
			}

			if (meta.xmtp()) {
				score += XMTP_SCORE;
			}

			if (meta.socials() != null) {
				for (val s : meta.socials()) {
					if (s.dappName().equals("farcaster")) {
						score += FARCASTER_SCORE;
					}

					if (s.dappName().equals("lens")) {
						score += LENS_SCORE;
					}
				}
			}
		}
		return score;
	}
}