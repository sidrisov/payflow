package ua.sinaver.web3.service;

import java.util.List;

import ua.sinaver.web3.dto.FlowDto;
import ua.sinaver.web3.dto.WalletDto;

public interface IFlowService {
    void saveFlow(FlowDto flowDto);

    List<FlowDto> getAllFlows(String account);

    FlowDto findByUUID(String uuid);

    void addFlowWallet(String uuid, WalletDto wallet) throws Exception;

    void deleteFlowWallet(String uuid, WalletDto wallet) throws Exception;
}
