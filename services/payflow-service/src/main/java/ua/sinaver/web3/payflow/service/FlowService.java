package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.data.Flow;
import ua.sinaver.web3.payflow.data.Jar;
import ua.sinaver.web3.payflow.data.User;
import ua.sinaver.web3.payflow.data.Wallet;
import ua.sinaver.web3.payflow.graphql.generated.types.SocialDappName;
import ua.sinaver.web3.payflow.message.FlowMessage;
import ua.sinaver.web3.payflow.message.JarMessage;
import ua.sinaver.web3.payflow.message.WalletMessage;
import ua.sinaver.web3.payflow.repository.FlowRepository;
import ua.sinaver.web3.payflow.repository.JarRepository;
import ua.sinaver.web3.payflow.repository.UserRepository;
import ua.sinaver.web3.payflow.service.api.IFlowService;

import java.util.AbstractMap.SimpleEntry;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

import static ua.sinaver.web3.payflow.config.CacheConfig.USER_FLOWS_CACHE;
import static ua.sinaver.web3.payflow.service.TokenService.BASE_CHAIN_ID;

@Slf4j
@Service
@Transactional
public class FlowService implements IFlowService {
	@Autowired
	private JarRepository jarRepository;
	@Autowired
	private FlowRepository flowRepository;
	@Autowired
	private UserRepository userRepository;
	@Autowired
	private WalletService walletService;
	@Autowired
	private IdentityService identityService;
	@Autowired
	private AirstackSocialGraphService socialGraphService;

	@Override
	public Jar createJar(String title, String description, String image, String source, User user) {
		// use same signer as default flow
		// TODO: find Payflow Balance
		val signer = user.getDefaultFlow().getSigner();
		val signerProvider = user.getDefaultFlow().getSignerProvider();
		val signerType = user.getDefaultFlow().getSignerType();
		val signerCredential = user.getDefaultFlow().getSignerCredential();

		val flow = new Flow(user.getId(), title, signer,
				signerProvider, signerType, signerCredential,
				"safe", null);
		val uuid = flow.getUuid();
		val saltNonce = "payflow-alpha-".concat(uuid);
		flow.setType(Flow.FlowType.JAR);
		flow.setSaltNonce(saltNonce);

		val owners = new ArrayList<String>();
		owners.add(user.getIdentity());
		if (signer != null) {
			owners.add(signer);
		}

		val wallets = walletService.calculateWallets(owners, saltNonce)
				.stream()
				.map(w -> {
					val wallet = WalletMessage.convert(w);
					wallet.setFlow(flow);
					return wallet;
				}).toList();

		flow.setWallets(wallets);

		val jar = new Jar(flow, description, image, source);
		jarRepository.save(jar);
		return jar;
	}

	@Override
	public void saveFlow(FlowMessage flowDto, User user) {
		val flow = FlowMessage.convert(flowDto, user);
		flowRepository.save(flow);
		log.debug("Saved flow {}", flow);
	}

	@Override
	@Cacheable(value = USER_FLOWS_CACHE, key = "#user.identity")
	public List<FlowMessage> getAllFlows(User user) {
		val flows = new ArrayList<FlowMessage>();
		if (user.getFlows() != null) {
			val nativeFlows = user.getFlows().stream()
					.map(f -> FlowMessage.convert(f, user, true))
					.toList();
			flows.addAll(nativeFlows);
		}

		val verifications = identityService.getIdentityAddresses(user.getIdentity());
		if (verifications != null && !verifications.isEmpty()) {
			val verificationFlows = verifications.stream()
					.map(v -> FlowMessage.convertFarcasterVerification(v, user))
					.toList();
			flows.addAll(verificationFlows);
		}

		val bankrWalletAddress = identityService.getBankrWalletByIdentity(user.getIdentity());
		if (bankrWalletAddress != null) {
			flows.add(FlowMessage.convertBankrWallet(bankrWalletAddress, user));
		}

		val rodeoWalletAddress = identityService.getRodeoWalletByIdentity(user.getIdentity());
		if (rodeoWalletAddress != null) {
			flows.add(FlowMessage.convertRodeoWallet(rodeoWalletAddress, user));
		}

		return flows;
	}

	@Override
	public FlowMessage findByUUID(String uuid) {
		val flow = flowRepository.findByUuid(uuid);
		if (flow != null) {
			Optional<User> user = userRepository.findById(flow.getUserId());
			if (user.isPresent()) {
				return FlowMessage.convert(flow, user.get(), false);
			}
		}
		return null;
	}

	@Override
	public JarMessage findJarByUUID(String uuid) {
		val jar = jarRepository.findByFlowUuid(uuid);
		if (jar != null) {
			Optional<User> user = userRepository.findById(jar.getFlow().getUserId());
			if (user.isPresent()) {
				return JarMessage.convert(jar, user.get());
			}
		}
		return null;
	}

	@Override
	public void deleteFlowWallet(String uuid, WalletMessage walletDto, User user) throws Exception {
		val flow = flowRepository.findByUuid(uuid);
		if (flow == null) {
			throw new Exception("Flow doesn't exist");
		} else if (!flow.getUserId().equals(user.getId())) {
			throw new Exception("Authenticated user mismatch");
		}

		val network = walletDto.network();
		val address = walletDto.address();

		val walletOptional = flow.getWallets().stream()
				.filter(w -> w.getNetwork().equals(network) && w.getAddress().equals(address))
				.findFirst();
		if (walletOptional.isEmpty()) {
			return;
		}

		val wallet = walletOptional.get();
		// deleting smart wallets from flow doesn't make sense
		/*
		 * if (flow.isSmart()) {
		 * throw new Exception("Not allowed!");
		 * }
		 */

		flow.getWallets().remove(wallet);

		log.info("Removed wallet {} from flow {}", wallet, flow);
	}

	@Override
	public void addFlowWallet(String uuid, WalletMessage walletDto, User user) throws Exception {
		val flow = flowRepository.findByUuid(uuid);
		if (flow == null) {
			throw new Exception("Flow doesn't exist");
		} else if (!flow.getUserId().equals(user.getId())) {
			throw new Exception("Authenticated user mismatch");
		}

		val wallet = WalletMessage.convert(walletDto);

		wallet.setFlow(flow);
		flow.getWallets().add(wallet);

		log.info("Added wallet {} to flow {}", wallet, flow);
	}

	@Override
	public void updateFlowWallet(String uuid, WalletMessage walletDto, User user) throws Exception {
		val flow = flowRepository.findByUuid(uuid);
		if (flow == null) {
			throw new Exception("Flow doesn't exist");
		} else if (!flow.getUserId().equals(user.getId())) {
			throw new Exception("Authenticated user mismatch");
		}

		val network = walletDto.network();
		val address = walletDto.address();

		val walletOptional = flow.getWallets().stream()
				.filter(w -> w.getNetwork().equals(network) && w.getAddress().equals(address))
				.findFirst();
		if (walletOptional.isEmpty()) {
			throw new Exception("Wallet doesn't exist");
		}

		val wallet = walletOptional.get();
		if (flow.getWalletProvider() != null) {
			// update only fields need to be changed
			/*
			 * if (!wallet.getSafeVersion().equals(walletDto.safeVersion())) {
			 * wallet.setSafeVersion(walletDto.safeVersion());
			 * }
			 */

			if (!wallet.isDeployed() && walletDto.deployed()) {
				wallet.setDeployed(true);
			}
		}

		log.info("Updated wallet {}", wallet);
	}

	@Override
	public List<Flow> getOwnersOfLegacyFlows() {
		return userRepository.findUsersWithNonDisabledFlowAndWalletVersion("1.3.0")
				.stream()
				.toList();
	}

	// @Scheduled(initialDelay = 30 * 1000, fixedRate = 24 * 60 * 60 * 1000)
	public void printOwnersOfLegacyFlows() {
		val legacyFlows = getOwnersOfLegacyFlows();
		val ownersFarcaster = legacyFlows.stream()
				.map(flow -> {
					val user = userRepository.findById(flow.getUserId()).orElse(null);
					if (user == null)
						return null;

					val identityInfo = identityService.getIdentityInfo(user.getIdentity());
					if (identityInfo == null)
						return null;

					val socialEntry = identityInfo.meta().socials().stream()
							.filter(s -> s.dappName().equals(SocialDappName.farcaster.name()))
							.findFirst()
							.map(s -> new SimpleEntry<>(s.profileName(), s.profileId()))
							.orElse(null);

					if (socialEntry == null)
						return null;

					val walletAddress = flow.getWallets().stream()
							.filter(w -> w.getNetwork().equals(BASE_CHAIN_ID))
							.findFirst()
							.map(Wallet::getAddress)
							.orElse(null);

					if (walletAddress == null)
						return null;

					return new SimpleEntry<>(socialEntry, walletAddress);
				})
				.filter(Objects::nonNull)
				.toList();
		log.info("Owners of legacy flows (wallet version 1.3.0): [{}] {}", ownersFarcaster.size(), ownersFarcaster);
	}
}
