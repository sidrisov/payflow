package ua.sinaver.web3.payflow.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.dto.FlowMessage;
import ua.sinaver.web3.payflow.dto.JarMessage;
import ua.sinaver.web3.payflow.dto.WalletMessage;
import ua.sinaver.web3.payflow.dto.WalletSessionMessage;
import ua.sinaver.web3.payflow.repository.FlowRepository;
import ua.sinaver.web3.payflow.repository.WalletRepository;
import ua.sinaver.web3.payflow.service.FlowService;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.service.api.IUserService;

import static ua.sinaver.web3.payflow.config.CacheConfig.USER_FLOWS_CACHE;

import java.util.List;

@RestController
@RequestMapping("/flows")
@CrossOrigin(origins = "${payflow.dapp.url}", allowCredentials = "true")
@Transactional
@Slf4j
class FlowController {
	@Autowired
	private WalletRepository walletRepository;
	@Autowired
	private IUserService userService;

	@Autowired
	private FlowService flowService;

	@Autowired
	private IIdentityService identityService;

	@Autowired
	private FlowRepository flowRepository;

	@Autowired
	private CacheManager cacheManager;

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public void createFlow(@RequestBody FlowMessage flow, @AuthenticationPrincipal String identity) throws Exception {
		val user = userService.findByIdentity(identity);
		if (user == null) {
			throw new Exception("User doesn't exist: " + identity);
		}

		flowService.saveFlow(flow, user);
	}

	@GetMapping
	public List<FlowMessage> getAllFlows(@AuthenticationPrincipal String identity) throws Exception {
		val user = userService.findByIdentity(identity);
		if (user == null) {
			throw new Exception("User doesn't exist: " + identity);
		}
		return flowService.getAllFlows(user);
	}

	@GetMapping("/jar/{uuid}")
	public JarMessage getJarByUUID(@PathVariable String uuid) {
		val jarMessage = flowService.findJarByUUID(uuid);
		log.debug("{}", jarMessage);
		return jarMessage;
	}

	@GetMapping("/{uuid}")
	public FlowMessage getFlowByUUID(@PathVariable String uuid) {
		val flowMessage = flowService.findByUUID(uuid);
		log.debug("{}", flowMessage);
		return flowMessage;
	}

	@PutMapping("/receiving/{uuid}")
	public ResponseEntity<String> setReceivingFlow(
			@PathVariable String uuid,
			@AuthenticationPrincipal String identity) {
		log.debug("Setting a new receiving flow: {} for {}", uuid, identity);

		val user = userService.findByIdentity(identity);
		if (user == null) {
			log.error("User doesn't exist: {} ", identity);
			return ResponseEntity.badRequest().build();
		}

		if (!uuid.startsWith("0x")) {
			val flow = user.getFlows().stream()
					.filter(f -> StringUtils.equals(f.getUuid(), uuid))
					.findFirst().orElse(null);

			if (flow == null) {
				log.error("Flow not found: {} for {}", uuid, identity);
				return ResponseEntity.badRequest().build();
			}

			log.debug("Setting flow as receiving flow: {} for {}", flow, identity);
			user.setDefaultFlow(flow);
			user.setDefaultReceivingAddress(null);
		} else {
			val receivingAddress = identityService.getFarcasterAddressesByAddress(user.getIdentity()).stream()
					.filter(v -> v.equals(uuid)).findFirst().orElse(null);

			if (receivingAddress == null) {
				log.error("Receiving address: {} not in verifications of user: {}",
						uuid, user.getUsername());
				return ResponseEntity.badRequest().build();
			}

			log.debug("Setting address as receiving address: {} for {}", receivingAddress, user.getUsername());
			user.setDefaultFlow(null);
			user.setDefaultReceivingAddress(receivingAddress);
		}
		return ResponseEntity.ok().build();
	}

	@GetMapping("/wallets")
	public List<WalletMessage> getAllWallets() {
		return walletRepository.findAll().stream()
				.filter(w -> !w.isDisabled())
				.map(WalletMessage::from)
				.toList();
	}

	@PostMapping("/{uuid}/wallets/{address}/{chainId}/sessions")
	@ResponseStatus(HttpStatus.CREATED)
	public void createWalletSession(
			@AuthenticationPrincipal String identity,
			@PathVariable String uuid,
			@PathVariable String address,
			@PathVariable Integer chainId,
			@RequestBody WalletSessionMessage session) throws Exception {
		val user = userService.findByIdentity(identity);
		if (user == null) {
			throw new Exception("User doesn't exist: " + identity);
		}

		log.debug("Creating session for flow {} wallet {} on chain {}: {}",
				uuid, address, chainId, session);
		flowService.createWalletSession(uuid, address, chainId, session, user);
	}

	@GetMapping("/{uuid}/wallets/{address}/{chainId}/sessions")
	public List<WalletSessionMessage> getWalletSessions(
			@PathVariable String uuid,
			@PathVariable String address,
			@PathVariable Integer chainId,
			@AuthenticationPrincipal String identity) throws Exception {
		val user = userService.findByIdentity(identity);
		if (user == null) {
			throw new Exception("User doesn't exist: " + identity);
		}

		return flowService.getWalletSessions(uuid, address, chainId, user);
	}

	@PatchMapping("/{uuid}/wallets/{address}/{chainId}/sessions/{sessionId}")
	public ResponseEntity<String> updateWalletSession(
			@PathVariable String uuid,
			@PathVariable String address,
			@PathVariable Integer chainId,
			@PathVariable String sessionId,
			@RequestBody WalletSessionMessage session,
			@AuthenticationPrincipal String identity) throws Exception {
		val user = userService.findByIdentity(identity);
		if (user == null) {
			throw new Exception("User doesn't exist: " + identity);
		}

		flowService.updateWalletSession(uuid, address, chainId, sessionId, session, user);
		return ResponseEntity.ok().build();
	}

	@DeleteMapping("/{uuid}/wallets/{address}/{chainId}/sessions/{sessionId}")
	public ResponseEntity<String> deactivateWalletSession(
			@PathVariable String uuid,
			@PathVariable String address,
			@PathVariable Integer chainId,
			@PathVariable String sessionId,
			@AuthenticationPrincipal String identity) throws Exception {
		val user = userService.findByIdentity(identity);
		if (user == null) {
			throw new Exception("User doesn't exist: " + identity);
		}

		flowService.deactivateWalletSession(uuid, address, chainId, sessionId, user);
		return ResponseEntity.ok().build();
	}

	@PatchMapping("/{uuid}/archive")
	public ResponseEntity<String> archiveFlow(
			@PathVariable String uuid,
			@AuthenticationPrincipal String identity) {
		log.debug("Archiving flow: {} for {}", uuid, identity);

		val user = userService.findByIdentity(identity);
		if (user == null) {
			log.error("User doesn't exist: {} ", identity);
			return ResponseEntity.badRequest().build();
		}

		val flow = flowRepository.findByUuid(uuid);

		if (flow == null) {
			log.error("Flow not found: {} for {}", uuid, identity);
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Not found");
		}

		if (!flow.getUserId().equals(user.getId())) {
			log.error("Flow not found: {} for {}", uuid, identity);
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not allowed");
		}

		if (!flow.isArchived()) {
			log.debug("Setting flow as archived: {} for {}", flow, identity);
			flow.setArchived(true);

			cacheManager.getCache(USER_FLOWS_CACHE).evict(user.getIdentity());
		}

		return ResponseEntity.ok().build();
	}

	@PatchMapping("/{uuid}/title")
	public ResponseEntity<String> updateFlowTitle(
			@PathVariable String uuid,
			@RequestBody String title,
			@AuthenticationPrincipal String identity) {
		log.debug("Updating flow title: {} for {} to {}", uuid, identity, title);

		val user = userService.findByIdentity(identity);
		if (user == null) {
			log.error("User doesn't exist: {} ", identity);
			return ResponseEntity.badRequest().build();
		}

		val flow = user.getFlows().stream()
				.filter(f -> StringUtils.equals(f.getUuid(), uuid))
				.findFirst().orElse(null);

		if (flow == null) {
			log.error("Flow not found: {} for {}", uuid, identity);
			return ResponseEntity.badRequest().build();
		}

		if (StringUtils.isBlank(title)) {
			log.error("Title cannot be empty for flow: {}", uuid);
			return ResponseEntity.badRequest().body("Title cannot be empty");
		}

		log.debug("Setting flow title: {} for {} to {}", flow, identity, title);
		flow.setTitle(title);

		cacheManager.getCache(USER_FLOWS_CACHE).evict(user.getIdentity());

		return ResponseEntity.ok().build();
	}
}
