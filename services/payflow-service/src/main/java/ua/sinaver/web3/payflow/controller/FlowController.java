package ua.sinaver.web3.payflow.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.dto.FlowMessage;
import ua.sinaver.web3.payflow.dto.JarMessage;
import ua.sinaver.web3.payflow.dto.WalletMessage;
import ua.sinaver.web3.payflow.dto.WalletSessionMessage;
import ua.sinaver.web3.payflow.repository.WalletRepository;
import ua.sinaver.web3.payflow.service.FlowService;
import ua.sinaver.web3.payflow.service.api.IIdentityService;
import ua.sinaver.web3.payflow.service.api.IUserService;

import java.security.Principal;
import java.util.List;

// TODO: inject Authenticated user directly instead of fetching it with principal on every request
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

	/*
	 * @GetMapping("/{walletAddress}/nonce")
	 * public String nonce(@PathVariable String walletAddress) {
	 * val nonce = RandomStringUtils.random(10, true, true);
	 *
	 * log.debug("Wallet: {} - nonce: {} ", walletAddress, nonce);
	 * return nonce;
	 * }
	 *
	 * @PostMapping("/{walletAddress}/{verify}")
	 * public ResponseEntity<String> verify(@PathVariable String walletAddress,
	 *
	 * @RequestBody SiweChallengeMessage siwe,
	 * HttpSession session) {
	 * return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	 * }
	 */

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public void createFlow(@RequestBody FlowMessage flow, Principal principal) throws Exception {
		val user = userService.findByIdentity(principal.getName());
		if (user == null) {
			throw new Exception("User doesn't exist: " + principal.getName());
		}

		flowService.saveFlow(flow, user);
	}

	@GetMapping
	public List<FlowMessage> getAllFlows(Principal principal) throws Exception {
		val user = userService.findByIdentity(principal.getName());
		if (user == null) {
			throw new Exception("User doesn't exist: " + principal.getName());
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
	public ResponseEntity<String> setReceivingFlow(@PathVariable String uuid,
	                                               Principal principal) {
		log.debug("Setting a new receiving flow: {} for {}", uuid, principal);

		val user = userService.findByIdentity(principal.getName());
		if (user == null) {
			log.error("User doesn't exist: {} ", principal.getName());
			return ResponseEntity.badRequest().build();
		}

		if (!uuid.startsWith("0x")) {
			val flow = user.getFlows().stream()
					.filter(f -> StringUtils.equals(f.getUuid(), uuid))
					.findFirst().orElse(null);

			if (flow == null) {
				log.error("Flow not found: {} for {}", uuid, principal.getName());
				return ResponseEntity.badRequest().build();
			}

			log.debug("Setting flow as receiving flow: {} for {}", flow, principal.getName());
			user.setDefaultFlow(flow);
			user.setDefaultReceivingAddress(null);
		} else {
			val receivingAddress = identityService.getIdentityAddresses(user.getIdentity()).stream()
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

	/*
	 * @PostMapping("/{uuid}/wallet")
	 *
	 * @ResponseStatus(HttpStatus.CREATED)
	 * public void addFlowWallet(@PathVariable String uuid, @RequestBody
	 * WalletMessage wallet, Principal principal)
	 * throws Exception {
	 * val user = userService.findByIdentity(principal.getName());
	 * if (user == null) {
	 * throw new Exception("User doesn't exist: " + principal.getName());
	 * }
	 *
	 * log.debug("addFlowWallet() {} {}", uuid, wallet);
	 * flowService.addFlowWallet(uuid, wallet, user);
	 * }
	 *
	 * @PutMapping("/{uuid}/wallet")
	 *
	 * @ResponseStatus(HttpStatus.OK)
	 * public void updateFlowWallet(@PathVariable String uuid, @RequestBody
	 * WalletMessage wallet, Principal principal)
	 * throws Exception {
	 * val user = userService.findByIdentity(principal.getName());
	 * if (user == null) {
	 * throw new Exception("User doesn't exist: " + principal.getName());
	 * }
	 *
	 * log.debug("updateFlowWallet() {} {}", uuid, wallet);
	 * flowService.updateFlowWallet(uuid, wallet, user);
	 * }
	 *
	 * @DeleteMapping("/{uuid}/wallet")
	 * public void deleteFLowWallet(@PathVariable String uuid, @RequestBody
	 * WalletMessage wallet, Principal principal)
	 * throws Exception {
	 * val user = userService.findByIdentity(principal.getName());
	 * if (user == null) {
	 * throw new Exception("User doesn't exist: " + principal.getName());
	 * }
	 *
	 * flowService.deleteFlowWallet(uuid, wallet, user);
	 * }
	 */

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
			Principal principal) throws Exception {
		val user = userService.findByIdentity(principal.getName());
		if (user == null) {
			throw new Exception("User doesn't exist: " + principal.getName());
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
			Principal principal) throws Exception {
		val user = userService.findByIdentity(principal.getName());
		if (user == null) {
			throw new Exception("User doesn't exist: " + principal.getName());
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
			Principal principal) throws Exception {
		val user = userService.findByIdentity(principal.getName());
		if (user == null) {
			throw new Exception("User doesn't exist: " + principal.getName());
		}

		flowService.deactivateWalletSession(uuid, address, chainId, sessionId, user);
		return ResponseEntity.ok().build();
	}
}
