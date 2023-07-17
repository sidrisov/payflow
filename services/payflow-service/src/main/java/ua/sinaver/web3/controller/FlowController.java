package ua.sinaver.web3.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import jakarta.transaction.Transactional;
import ua.sinaver.web3.dto.FlowDto;
import ua.sinaver.web3.dto.WalletDto;
import ua.sinaver.web3.service.IFlowService;

@RestController
@RequestMapping("/flows")
@CrossOrigin // default - allow all origins
@Transactional
class FlowController {
    public static final Logger LOGGER = LoggerFactory.getLogger(FlowController.class);

    @Autowired
    private IFlowService flowService;

    @PostMapping
    public void createFlow(@RequestBody FlowDto flow) {
        flowService.saveFlow(flow);
    }

    @GetMapping
    public List<FlowDto> getAllFlowsForAccount(@RequestParam String account) {
        return flowService.getAllFlows(account);
    }

    @GetMapping("/{uuid}")
    public FlowDto getFlowByUUID(@PathVariable String uuid) {
        return flowService.findByUUID(uuid);
    }

    @PostMapping("/{uuid}/wallet")
    public void addFlowWallet(@PathVariable String uuid, @RequestBody WalletDto wallet) throws Exception {
        LOGGER.debug("addFlowWallet() {} {}", uuid, wallet);
        flowService.addFlowWallet(uuid, wallet);
    }

    @DeleteMapping("/{uuid}/wallet")
    public void deleteFLowWallet(@PathVariable String uuid, @RequestBody WalletDto wallet) throws Exception {
        flowService.deleteFlowWallet(uuid, wallet);
    }
}
