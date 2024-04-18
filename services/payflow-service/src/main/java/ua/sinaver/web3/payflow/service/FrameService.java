package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.data.Gift;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.graphql.generated.types.Social;
import ua.sinaver.web3.payflow.graphql.generated.types.SocialDappName;
import ua.sinaver.web3.payflow.message.ContactMessage;
import ua.sinaver.web3.payflow.repository.GiftRepository;
import ua.sinaver.web3.payflow.repository.UserRepository;
import ua.sinaver.web3.payflow.service.api.IContactBookService;
import ua.sinaver.web3.payflow.service.api.IFrameService;
import ua.sinaver.web3.payflow.service.api.ISocialGraphService;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.Random;

@Service
@Transactional
@Slf4j
public class FrameService implements IFrameService {

	private static final List<String> TOKENS = Arrays.asList("eth", "usdc", "degen");
	@Autowired
	private ISocialGraphService socialGraphService;
	@Autowired
	private UserRepository userRepository;
	@Autowired
	private IContactBookService contactBookService;
	@Autowired
	private GiftRepository giftRepository;
	@Value("${payflow.frames.gift.limit:100}")
	private long totalGiftNumberLimit;

	@Override
	public ContactMessage giftSpin(User gifter) throws Exception {

		long totalGiftNumber = giftRepository.count();

		if (totalGiftNumber >= totalGiftNumberLimit) {
			log.warn("Total gift spin limit reached: {}", totalGiftNumberLimit);
			throw new Exception("GIFT_CAMPAIGN_LIMIT_REACHED");
		}

		val existingUserGifts =
				giftRepository.findAllByGifter(gifter).stream().map(g -> g.getGifted().getIdentity()).toList();
		if (existingUserGifts.size() == 10) {
			log.warn("Gift spin limit reached for {}", gifter.getUsername());
			throw new Exception("GIFT_SPIN_LIMIT_REACHED");
		}

		val contacts = contactBookService.getAllContacts(gifter)
				.stream().filter(c -> c.profile() != null)
				.filter(c -> !existingUserGifts.contains(c.profile().identity()))
				.toList();

		if (contacts.isEmpty()) {
			log.warn("No contacts available to gift for {}",
					gifter.getUsername());
			throw new Exception("NO_CONTACT_TO_GIFT");
		}

		val random = new Random();
		val randomContactIndex = random.nextInt(contacts.size());
		val giftedContact = contacts.get(randomContactIndex);

		val randomTokenIndex = random.nextInt(TOKENS.size());
		val randomToken = TOKENS.get(randomTokenIndex);
		val gifted = userRepository.findByIdentity(giftedContact.profile().identity());
		giftRepository.save(new Gift(gifter, gifted, randomToken));
		return giftedContact;
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
		val wallet = socialGraphService.getSocialMetadata(
				"fc_fid:".concat(String.valueOf(fid)), null);
		val addresses = wallet.getAddresses();
		log.debug("Addresses for {}: {}", fid, addresses);

		return getFidProfiles(addresses);
	}

	@Override
	public List<User> getFidProfiles(String fname) {
		val wallet = socialGraphService.getSocialMetadata(
				"fc_fname:".concat(String.valueOf(fname)), null);
		val addresses = wallet.getAddresses();
		log.debug("Addresses for {}: {}", fname, addresses);

		return getFidProfiles(addresses);
	}

	@Override
	public List<String> getFidAddresses(int fid) {
		val wallet = socialGraphService.getSocialMetadata(
				"fc_fid:".concat(String.valueOf(fid)), null);
		val addresses = wallet.getAddresses();
		log.debug("Addresses for {}: {}", fid, addresses);

		return addresses;
	}

	@Override
	public List<String> getFnameAddresses(String fname) {
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

	@Override
	public String getFidFname(int fid) {
		val wallet = socialGraphService.getSocialMetadata(
				"fc_fid:".concat(String.valueOf(fid)), null);
		val username = wallet.getSocials().stream()
				.filter(social -> social.getDappName().equals(SocialDappName.farcaster))
				.findFirst().map(Social::getProfileName).orElse(null);
		log.debug("Username for {}: {}", fid, username);
		return username;
	}

	@Override
	public String getIdentityFname(String identity) {
		val wallet = socialGraphService.getSocialMetadata(identity, null);
		val username = wallet.getSocials().stream()
				.filter(social -> social.getDappName().equals(SocialDappName.farcaster))
				.findFirst().map(Social::getProfileName).orElse(null);
		log.debug("Username for {}: {}", identity, username);
		return username;
	}
}
