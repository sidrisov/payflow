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
import ua.sinaver.web3.data.User;
import ua.sinaver.web3.data.Wallet;
import ua.sinaver.web3.message.FlowMessage;
import ua.sinaver.web3.message.WalletMessage;
import ua.sinaver.web3.repository.FlowRepository;
import ua.sinaver.web3.repository.UserRepository;
import ua.sinaver.web3.repository.AccountRepository;

@Service
@Transactional
public class FlowService implements IFlowService {
    public static final Logger LOGGER = LoggerFactory.getLogger(FlowService.class);

    @Autowired
    private FlowRepository flowRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public void saveFlow(FlowMessage flowDto, User user) {
        Flow flow = convert(flowDto, user);
        flowRepository.save(flow);
        LOGGER.info("Saved flow {}", flow);
    }

    @Override
    public List<FlowMessage> getAllFlows(User user) {
        List<Flow> flows = flowRepository.findByUserId(user.getId());
        return flows.stream()
                .map(f -> convert(f, user))
                .toList();
    }

    @Override
    public FlowMessage findByUUID(String uuid) {
        Flow flow = flowRepository.findByUuid(uuid);
        if (flow != null) {
            Optional<User> user = userRepository.findById(flow.getId());
            if (user.isPresent()) {
                return convert(flow, user.get());
            }
        }
        return null;
    }

    @Override
    public void deleteFlowWallet(String uuid, WalletMessage walletDto, User user) throws Exception {
        Flow flow = flowRepository.findByUuid(uuid);
        if (flow == null) {
            throw new Exception("Flow doesn't exist");
        } else if (!flow.getUserId().equals(user.getId())) {
            throw new Exception("Authenticated user mismatch");
        }

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
    }

    @Override
    public void addFlowWallet(String uuid, WalletMessage walletDto, User user) throws Exception {
        Flow flow = flowRepository.findByUuid(uuid);

        if (flow == null) {
            throw new Exception("Flow doesn't exist");
        } else if (!flow.getUserId().equals(user.getId())) {
            throw new Exception("Authenticated user mismatch");
        }

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

    }

    private static FlowMessage convert(Flow flow, User user) {
        List<WalletMessage> wallets = flow.getWallets().stream().map(w -> convert(w))
                .toList();
        return new FlowMessage(user.getSigner(), flow.getTitle(), flow.getDescription(), flow.getUUID(),
                wallets);
    }

    private static Flow convert(FlowMessage flowDto, User user) {
        Flow flow = new Flow(user.getId(), flowDto.title(), flowDto.description());
        List<Wallet> wallets = flowDto.wallets().stream().map(w -> {
            Wallet wallet = convert(w);
            wallet.setFlow(flow);
            return wallet;
        }).toList();
        flow.setWallets(wallets);
        return flow;
    }

    private static Wallet convert(WalletMessage walletDto) {
        return new Wallet(walletDto.address(), walletDto.network(), walletDto.smart());
    }

    // TODO: wallet.getMaster() != null redundant check, but since we have stale
    // date, let's keep it till next db wipe
    private static WalletMessage convert(Wallet wallet) {
        return new WalletMessage(wallet.getAddress(), wallet.getNetwork(), wallet.isSmart(),
                wallet.isSmart() && wallet.getMaster() != null ? wallet.getMaster().getAddress() : null);
    }
}
