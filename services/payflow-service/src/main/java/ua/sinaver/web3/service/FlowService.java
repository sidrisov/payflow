package ua.sinaver.web3.service;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import ua.sinaver.web3.data.Account;
import ua.sinaver.web3.data.Flow;
import ua.sinaver.web3.data.Wallet;
import ua.sinaver.web3.dto.FlowDto;
import ua.sinaver.web3.dto.WalletDto;
import ua.sinaver.web3.repository.FlowRepository;
import ua.sinaver.web3.repository.AccountRepository;

@Service
@Transactional
public class FlowService implements IFlowService {
    public static final Logger LOGGER = LoggerFactory.getLogger(FlowService.class);

    @Autowired
    private FlowRepository flowRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Override
    public void saveFlow(FlowDto flowDto) {
        Flow flow = convert(flowDto);
        flowRepository.save(flow);
        LOGGER.info("Saved flow {}", flow);
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

    @Override
    public void deleteFlowWallet(String uuid, WalletDto walletDto) throws Exception {
        Flow flow = flowRepository.findByUuid(uuid);
        if (flow != null) {
            String network = walletDto.network();
            String address = walletDto.address();

            Optional<Wallet> walletOptional = flow.getWallets().stream()
                    .filter(w -> w.getNetwork().equals(network) && w.getAddress().equals(address))
                    .findFirst();
            if (!walletOptional.isPresent()) {
                return;
            }

            Wallet wallet = walletOptional.get();
            // deleting smart wallets from flow doesn't make sense
            if (wallet.isSmart()) {
                throw new Exception("Not allowed!");
            }

            flow.getWallets().remove(wallet);

            LOGGER.info("Removed wallet {} from flow {}", wallet, flow);
        } else {
            throw new Exception("Flow doesn't exist");
        }
    }

    @Override
    public void addFlowWallet(String uuid, WalletDto walletDto) throws Exception {
        Flow flow = flowRepository.findByUuid(uuid);

        if (flow != null) {
            Wallet wallet = convert(walletDto);

            if (wallet.isSmart()) {
                Account account = accountRepository.findByAddressAndNetwork(walletDto.master(),
                        walletDto.network());
                if (account != null) {
                    wallet.setMaster(account);
                    account.getWallets().add(wallet);
                } else {
                    throw new Exception("Account doesn't exist");
                }
            }

            wallet.setFlow(flow);
            flow.getWallets().add(wallet);

            LOGGER.info("Added wallet {} to flow {}", wallet, flow);
        } else {
            throw new Exception("Flow doesn't exist");
        }
    }

    private static FlowDto convert(Flow flow) {
        List<WalletDto> wallets = flow.getWallets().stream().map(w -> convert(w))
                .toList();
        return new FlowDto(flow.getAccount(), flow.getTitle(), flow.getDescription(), flow.getUUID(),
                wallets);
    }

    private static Flow convert(FlowDto flowDto) {
        Flow flow = new Flow(flowDto.account(), flowDto.title(), flowDto.description());
        List<Wallet> wallets = flowDto.wallets().stream().map(w -> {
            Wallet wallet = convert(w);
            wallet.setFlow(flow);
            return wallet;
        }).toList();
        flow.setWallets(wallets);
        return flow;
    }

    private static Wallet convert(WalletDto walletDto) {
        return new Wallet(walletDto.address(), walletDto.network(), walletDto.smart());
    }

    // TODO: wallet.getMaster() != null redundant check, but since we have stale
    // date, let's keep it till next db wipe
    private static WalletDto convert(Wallet wallet) {
        return new WalletDto(wallet.getAddress(), wallet.getNetwork(), wallet.isSmart(),
                wallet.isSmart() && wallet.getMaster() != null ? wallet.getMaster().getAddress() : null);
    }
}
