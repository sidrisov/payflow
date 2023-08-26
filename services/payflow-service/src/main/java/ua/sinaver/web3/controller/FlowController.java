package ua.sinaver.web3.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import jakarta.transaction.Transactional;
import lombok.val;
import lombok.extern.slf4j.Slf4j;
import ua.sinaver.web3.message.FlowMessage;
import ua.sinaver.web3.message.WalletMessage;
import ua.sinaver.web3.service.IFlowService;
import ua.sinaver.web3.service.IUserService;

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
        val user = userService.findUser(principal.getName());
        if (user == null) {
            throw new Exception("User doesn't exist: " + principal.getName());
        }

        flowService.saveFlow(flow, user);
    }

    @GetMapping
    public List<FlowMessage> getAllFlows(Principal principal) throws Exception {
        val user = userService.findUser(principal.getName());
        if (user == null) {
            throw new Exception("User doesn't exist: " + principal.getName());
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
        val user = userService.findUser(principal.getName());
        if (user == null) {
            throw new Exception("User doesn't exist: " + principal.getName());
        }

        log.debug("addFlowWallet() {} {}", uuid, wallet);
        flowService.addFlowWallet(uuid, wallet, user);
    }

    @DeleteMapping("/{uuid}/wallet")
    public void deleteFLowWallet(@PathVariable String uuid, @RequestBody WalletMessage wallet, Principal principal)
            throws Exception {
        val user = userService.findUser(principal.getName());
        if (user == null) {
            throw new Exception("User doesn't exist: " + principal.getName());
        }

        flowService.deleteFlowWallet(uuid, wallet, user);
    }
}
