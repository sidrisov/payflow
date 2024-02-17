package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.message.ContactMessage;
import ua.sinaver.web3.payflow.repository.UserRepository;
import ua.sinaver.web3.payflow.service.api.IContactBookService;
import ua.sinaver.web3.payflow.service.api.IFrameService;
import ua.sinaver.web3.payflow.service.api.ISocialGraphService;

import java.util.List;
import java.util.Objects;
import java.util.Random;

@Service
@Transactional
@Slf4j
public class FrameService implements IFrameService {

	@Autowired
	private ISocialGraphService socialGraphService;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private IContactBookService contactBookService;

	@Override
	public ContactMessage giftSpin(User initiator) {
		val contacts = contactBookService.getAllContacts(initiator)
				.stream().filter(c -> c.profile() != null).toList();

		if (contacts.isEmpty()) {
			return null;
		}

		val random = new Random();
		val randomContactIndex = random.nextInt(contacts.size());

		return contacts.get(randomContactIndex);

	}

	@Override
	public User getFidProfile(int fid, String identity) {
		val profiles = getFidProfiles(fid);

		return profiles.stream()
				.filter(p -> StringUtils.isBlank(identity) || p.getIdentity().equals(identity))
				.findFirst().orElse(null);
	}

	@Override
	public User getFidProfile(String fname, String identity) {
		val profiles = getFidProfiles(fname);

		return profiles.stream()
				.filter(p -> StringUtils.isBlank(identity) || p.getIdentity().equals(identity))
				.findFirst().orElse(null);
	}

	@Override
	public List<User> getFidProfiles(int fid) {
		// evict cache TODO: replace with Evict annotation
		socialGraphService.cleanCache("fc_fid:".concat(String.valueOf(fid)), null);
		val wallet = socialGraphService.getSocialMetadata(
				"fc_fid:".concat(String.valueOf(fid)), null);
		val addresses = wallet.getAddresses();
		log.debug("Addresses for {}: {}", fid, addresses);

		return getFidProfiles(addresses);
	}

	@Override
	public List<User> getFidProfiles(String fname) {
		// evict cache TODO: replace with Evict annotation
		socialGraphService.cleanCache("fc_fname:".concat(String.valueOf(fname)), null);
		val wallet = socialGraphService.getSocialMetadata(
				"fc_fname:".concat(String.valueOf(fname)), null);
		val addresses = wallet.getAddresses();
		log.debug("Addresses for {}: {}", fname, addresses);

		return getFidProfiles(addresses);
	}

	@Override
	public List<String> getFidAddresses(int fid) {
		// evict cache TODO: replace with Evict annotation
		socialGraphService.cleanCache("fc_fid:".concat(String.valueOf(fid)), null);
		val wallet = socialGraphService.getSocialMetadata(
				"fc_fid:".concat(String.valueOf(fid)), null);
		val addresses = wallet.getAddresses();
		log.debug("Addresses for {}: {}", fid, addresses);

		return addresses;
	}

	@Override
	public List<String> getFnameAddresses(String fname) {
		// evict cache TODO: replace with Evict annotation
		socialGraphService.cleanCache("fc_fname:".concat(String.valueOf(fname)), null);
		val wallet = socialGraphService.getSocialMetadata(
				"fc_fname:".concat(String.valueOf(fname)), null);
		val addresses = wallet.getAddresses();
		log.debug("Addresses for {}: {}", fname, addresses);

		return addresses;
	}

	@Override
	public List<User> getFidProfiles(List<String> addresses) {
		return addresses.stream().map(address -> userRepository.findByIdentityAndAllowedTrue(address))
				.filter(Objects::nonNull).limit(3).toList();
	}
}

/*
@NotNull
private static String getInsightsMeta(SocialInsights insights) {
	String insightsMeta = "";
	var buttonIndex = 1;

	if (insights.farcasterFollow() != null) {
		insightsMeta = insightsMeta.concat(String.format(
				"""
						<meta property="fc:frame:button:%s" content="Farcaster %s"/>
						""", buttonIndex, insights.farcasterFollow()));
		buttonIndex++;
	}

	if (insights.lensFollow() != null) {
		insightsMeta = insightsMeta.concat(String.format(
				"""
						<meta property="fc:frame:button:%s" content="Lens %s"/>
						""", buttonIndex, insights.lensFollow()));
		buttonIndex++;
	}

	if (insights.sentTxs() != 0) {
		insightsMeta = insightsMeta.concat(String.format(
				"""
						<meta property="fc:frame:button:%s" content="Transacted %s"/>
						""", buttonIndex,
				insights.sentTxs() == 1 ? "once" : String.format("%s times", insights.sentTxs())));
	}

	if (insightsMeta.isEmpty()) {
		insightsMeta = insightsMeta.concat(String.format(
				"""
						<meta property="fc:frame:button:%s" content="🤷🏻 No social insights between you"/>
						""", buttonIndex));
	}
	return insightsMeta;
}
*/

// handle insights
			/*if (buttonIndex == 3 && fid != casterFid) {
				log.debug("Handling insights action: {}", validateMessage);
				// clean cache
				socialGraphService.cleanCache(String.format("fc_fid:%s", casterFid),
						String.format("fc_fid:%s", fid));
				val casterWallet = socialGraphService.getSocialMetadata(
						String.format("fc_fid:%s", casterFid),
						String.format("fc_fid:%s", fid));
				log.debug("Found caster wallet meta {}", casterWallet);
				if (casterWallet != null) {
					val insights = getWalletInsights(casterWallet);
					String insightsMeta = getInsightsMeta(insights);
					return ResponseEntity.status(HttpStatus.OK).contentType(MediaType.APPLICATION_XHTML_XML).body(String.format("""
							<!DOCTYPE html>
							<html>
							<head>
							<meta property="fc:frame" content="vNext" />
							<meta property="fc:frame:image" content="%s"/>
							%s
							</head>
							</html>
							""", profileImage, insightsMeta));
				}
			}*/
