package ua.sinaver.web3.controller;

import java.security.Principal;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.bind.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import jakarta.transaction.Transactional;
import ua.sinaver.web3.data.User;
import ua.sinaver.web3.message.FlowMessage;
import ua.sinaver.web3.message.WalletMessage;
import ua.sinaver.web3.service.IFlowService;
import ua.sinaver.web3.service.IUserService;

// TODO: inject Authenticated user directly instead of fetching it with principal on every request
@RestController
@RequestMapping("/flows")
@CrossOrigin(origins = "${dapp.url}", allowCredentials = "true")
@Transactional
class FlowController {
    private static final Logger LOGGER = LoggerFactory.getLogger(FlowController.class);

    @Autowired
    private IUserService userService;

    @Autowired
    private IFlowService flowService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void createFlow(@RequestBody FlowMessage flow, Principal principal) throws Exception {
        User user = userService.findUser(principal.getName());
        if (user == null) {
            throw new Exception("User doesn't exist: " + principal.getName());
        }

        flowService.saveFlow(flow, user);
    }

    @GetMapping
    public List<FlowMessage> getAllFlowsForAccount(Principal principal) throws Exception {
        User user = userService.findUser(principal.getName());
        if (user == null) {
            throw new Exception("User doesn't exist: " + principal.getName());
        }

        return flowService.getAllFlows(user);
    }

    @GetMapping("/{uuid}")
    public FlowMessage getFlowByUUID(@PathVariable String uuid) {
        return flowService.findByUUID(uuid);
    }

    @PostMapping("/{uuid}/wallet")
    @ResponseStatus(HttpStatus.CREATED)
    public void addFlowWallet(@PathVariable String uuid, @RequestBody WalletMessage wallet, Principal principal)
            throws Exception {
        User user = userService.findUser(principal.getName());
        if (user == null) {
            throw new Exception("User doesn't exist: " + principal.getName());
        }

        LOGGER.debug("addFlowWallet() {} {}", uuid, wallet);
        flowService.addFlowWallet(uuid, wallet, user);
    }

    @DeleteMapping("/{uuid}/wallet")
    public void deleteFLowWallet(@PathVariable String uuid, @RequestBody WalletMessage wallet, Principal principal)
            throws Exception {
        User user = userService.findUser(principal.getName());
        if (user == null) {
            throw new Exception("User doesn't exist: " + principal.getName());
        }

        flowService.deleteFlowWallet(uuid, wallet, user);
    }
}
