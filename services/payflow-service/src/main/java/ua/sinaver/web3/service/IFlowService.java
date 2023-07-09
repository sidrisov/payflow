package ua.sinaver.web3.service;

import java.util.List;

import ua.sinaver.web3.dto.FlowDto;

public interface IFlowService {
    void saveFlow(FlowDto flowDto);

    List<FlowDto> getAllFlows(String account);

    FlowDto findByUUID(String uuid);
}
