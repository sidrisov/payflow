package ua.sinaver.web3.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import ua.sinaver.web3.data.Flow;
import ua.sinaver.web3.data.Wallet;
import ua.sinaver.web3.dto.FlowDto;
import ua.sinaver.web3.dto.WalletDto;
import ua.sinaver.web3.repository.FlowRepository;

@Service
@Transactional
public class FlowService implements IFlowService {

    @Autowired
    private FlowRepository flowRepository;

    @Override
    public void saveFlow(FlowDto flowDto) {
        flowRepository.save(convert(flowDto));
    }

    @Override
    public List<FlowDto> getAllFlows(String account) {
        List<Flow> flows = flowRepository.findByAccount(account);
        return flows.stream()
                .map(FlowService::convert)
                .toList();
    }

    @Override
    public FlowDto findByUUID(String uuid) {
        Flow flow = flowRepository.findByUuid(uuid);
        if (flow != null) {
            return convert(flow);
        }
        return null;
    }

    private static FlowDto convert(Flow flow) {
        List<WalletDto> wallets = flow.getWallets().stream().map(w -> new WalletDto(w.getAddress(), w.getNetwork()))
                .toList();
        return new FlowDto(flow.getAccount(), flow.getTitle(), flow.getDescription(), flow.getUUID(),
                wallets);
    }

    private static Flow convert(FlowDto flowDto) {
        Flow flow = new Flow(flowDto.account(), flowDto.title(), flowDto.description());
        List<Wallet> wallets = flowDto.wallets().stream().map(w -> new Wallet(w.address(), w.network(), flow)).toList();
        flow.setWallets(wallets);
        return flow;
    }
}
