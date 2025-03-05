package ua.sinaver.web3.payflow.service;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.RandomStringUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import ua.sinaver.web3.payflow.dto.FlowMessage;
import ua.sinaver.web3.payflow.dto.JarMessage;
import ua.sinaver.web3.payflow.dto.WalletMessage;
import ua.sinaver.web3.payflow.dto.WalletSessionMessage;
import ua.sinaver.web3.payflow.entity.*;
import ua.sinaver.web3.payflow.graphql.generated.types.SocialDappName;
import ua.sinaver.web3.payflow.mapper.WalletSessionMapper;
import ua.sinaver.web3.payflow.repository.FlowRepository;
import ua.sinaver.web3.payflow.repository.JarRepository;
import ua.sinaver.web3.payflow.repository.UserRepository;
import ua.sinaver.web3.payflow.repository.WalletSessionRepository;

import java.time.Instant;
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
public class FlowService {
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
	private WalletSessionRepository walletSessionRepository;

	@Autowired
	private WalletSessionMapper walletSessionMapper;

	@CacheEvict(value = USER_FLOWS_CACHE, key = "#user.identity")
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
		val saltNonce = "payflow-wallet-v1-".concat(RandomStringUtils.secure().nextAlphanumeric(8));
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
					val wallet = w.toEntity();
					wallet.setFlow(flow);
					return wallet;
				}).toList();

		flow.setWallets(wallets);

		val jar = new Jar(flow, description, image, source);
		jarRepository.save(jar);
		return jar;
	}

	@CacheEvict(value = USER_FLOWS_CACHE, key = "#user.identity")
	public void saveFlow(FlowMessage flowDto, User user) {
		val flow = FlowMessage.convert(flowDto, user);
		flowRepository.save(flow);
		log.debug("Saved flow {}", flow);
	}

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

	public void addFlowWallet(String uuid, WalletMessage walletDto, User user) throws Exception {
		val flow = flowRepository.findByUuid(uuid);
		if (flow == null) {
			throw new Exception("Flow doesn't exist");
		} else if (!flow.getUserId().equals(user.getId())) {
			throw new Exception("Authenticated user mismatch");
		}

		val wallet = walletDto.toEntity();

		wallet.setFlow(flow);
		flow.getWallets().add(wallet);

		log.info("Added wallet {} to flow {}", wallet, flow);
	}

	@CacheEvict(value = USER_FLOWS_CACHE, key = "#user.identity")
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

	public void createWalletSession(String uuid, String address, Integer chainId,
			WalletSessionMessage session, User user) throws Exception {
		val flow = flowRepository.findByUuid(uuid);
		if (flow == null) {
			throw new Exception("Flow doesn't exist");
		} else if (!flow.getUserId().equals(user.getId())) {
			throw new Exception("Authenticated user mismatch");
		}

		val wallet = flow.getWallets().stream()
				.filter(w -> StringUtils.equalsIgnoreCase(w.getAddress(), address) &&
						w.getNetwork().equals(chainId))
				.findFirst()
				.orElseThrow(() -> new Exception("Wallet not found"));

		val walletSession = walletSessionMapper.toEntity(session);
		walletSession.setWallet(wallet);
		wallet.getSessions().add(walletSession);

		log.debug("Created session {} for wallet {}", session, wallet);
	}

	public List<WalletSessionMessage> getWalletSessions(String uuid, String address,
			Integer chainId, User user) throws Exception {
		val flow = flowRepository.findByUuid(uuid);
		if (flow == null) {
			throw new Exception("Flow doesn't exist");
		} else if (!flow.getUserId().equals(user.getId())) {
			throw new Exception("Authenticated user mismatch");
		}

		return flow.getWallets().stream()
				.filter(w -> StringUtils.equalsIgnoreCase(w.getAddress(), address) &&
						w.getNetwork().equals(chainId))
				.findFirst()
				.map(wallet -> wallet.getSessions().stream()
						.filter(WalletSession::getActive)
						.map(walletSession -> walletSessionMapper.toDto(walletSession))
						.toList())
				.orElse(List.of());
	}

	public void updateWalletSession(String uuid, String address, Integer chainId,
			String sessionId, WalletSessionMessage sessionUpdate, User user) throws Exception {
		val flow = flowRepository.findByUuid(uuid);
		if (flow == null) {
			throw new Exception("Flow doesn't exist");
		} else if (!flow.getUserId().equals(user.getId())) {
			throw new Exception("Authenticated user mismatch");
		}

		val wallet = flow.getWallets().stream()
				.filter(w -> StringUtils.equalsIgnoreCase(w.getAddress(), address) &&
						w.getNetwork().equals(chainId))
				.findFirst()
				.orElseThrow(() -> new Exception("Wallet not found"));

		val session = wallet.getSessions().stream()
				.filter(s -> s.getSessionId().equals(sessionId))
				.findFirst()
				.orElseThrow(() -> new Exception("Session not found"));

		// Update session fields
		session.setActive(sessionUpdate.active());
		session.setExpiresAt(sessionUpdate.expiresAt());
		session.setActions(sessionUpdate.actions());

		log.debug("Updated session {} for wallet {}", session, wallet);
	}

	public void deactivateWalletSession(String uuid, String address, Integer chainId,
			String sessionId, User user) throws Exception {
		val flow = flowRepository.findByUuid(uuid);
		if (flow == null) {
			throw new Exception("Flow doesn't exist");
		} else if (!flow.getUserId().equals(user.getId())) {
			throw new Exception("Authenticated user mismatch");
		}

		val wallet = flow.getWallets().stream()
				.filter(w -> StringUtils.equalsIgnoreCase(w.getAddress(), address) &&
						w.getNetwork().equals(chainId))
				.findFirst()
				.orElseThrow(() -> new Exception("Wallet not found"));

		val session = wallet.getSessions().stream()
				.filter(s -> s.getSessionId().equals(sessionId))
				.findFirst()
				.orElseThrow(() -> new Exception("Session not found"));

		session.setActive(false);
		session.setSessionKey("0x0");

		log.debug("Deactivated session {} for wallet {}", session, wallet);
	}

	@Scheduled(initialDelay = 60_000, fixedRate = 60_000)
	public void checkAndDeactivateExpiredSessions() {
		log.debug("Checking for expired wallet sessions...");
		walletSessionRepository.deactivateExpiredSessions(Instant.now());
		log.debug("Completed deactivating expired sessions");
	}
}
