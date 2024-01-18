package ua.sinaver.web3.controller;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ua.sinaver.web3.message.FlowMessage;
import ua.sinaver.web3.message.WalletMessage;
import ua.sinaver.web3.service.IFlowService;
import ua.sinaver.web3.service.IUserService;

import java.security.Principal;
import java.util.List;

// TODO: inject Authenticated user directly instead of fetching it with principal on every request
@RestController
@RequestMapping("/flows")
@CrossOrigin(origins = "${dapp.url}", allowCredentials = "true")
@Transactional
@Slf4j
class FlowController {
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

	@GetMapping("/public/{username}")
	public List<FlowMessage> getAllPublicFlows(@PathVariable String username) throws Exception {
		val user = userService.findByUsername(username);
		if (user == null) {
			throw new Exception("User doesn't exist: " + username);
		}

		return flowService.getAllFlows(user);
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
}
