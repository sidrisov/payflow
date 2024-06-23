package ua.sinaver.web3.payflow.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.payflow.message.FlowMessage;
import ua.sinaver.web3.payflow.message.JarMessage;
import ua.sinaver.web3.payflow.message.WalletMessage;
import ua.sinaver.web3.payflow.repository.FlowRepository;
import ua.sinaver.web3.payflow.repository.WalletRepository;
import ua.sinaver.web3.payflow.service.api.IFlowService;
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
	private FlowRepository flowRepository;
	@Autowired
	private WalletRepository walletRepository;
	@Autowired
	private IUserService userService;

	@Autowired
	private IFlowService flowService;

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

	@PostMapping("/{uuid}/wallet")
	@ResponseStatus(HttpStatus.CREATED)
	public void addFlowWallet(@PathVariable String uuid, @RequestBody WalletMessage wallet, Principal principal)
			throws Exception {
		val user = userService.findByIdentity(principal.getName());
		if (user == null) {
			throw new Exception("User doesn't exist: " + principal.getName());
		}

		log.debug("addFlowWallet() {} {}", uuid, wallet);
		flowService.addFlowWallet(uuid, wallet, user);
	}

	@PutMapping("/{uuid}/wallet")
	@ResponseStatus(HttpStatus.OK)
	public void updateFlowWallet(@PathVariable String uuid, @RequestBody WalletMessage wallet, Principal principal)
			throws Exception {
		val user = userService.findByIdentity(principal.getName());
		if (user == null) {
			throw new Exception("User doesn't exist: " + principal.getName());
		}

		log.debug("updateFlowWallet() {} {}", uuid, wallet);
		flowService.updateFlowWallet(uuid, wallet, user);
	}

	@DeleteMapping("/{uuid}/wallet")
	public void deleteFLowWallet(@PathVariable String uuid, @RequestBody WalletMessage wallet, Principal principal)
			throws Exception {
		val user = userService.findByIdentity(principal.getName());
		if (user == null) {
			throw new Exception("User doesn't exist: " + principal.getName());
		}

		flowService.deleteFlowWallet(uuid, wallet, user);
	}

	@GetMapping("/wallets")
	public List<WalletMessage> getAllWallets() {
		return walletRepository.findAll().stream()
				.filter(w -> !w.isDisabled())
				.map(WalletMessage::convert)
				.toList();
	}
}
