package ua.sinaver.web3.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import lombok.val;
import lombok.extern.slf4j.Slf4j;
import ua.sinaver.web3.data.Account;
import ua.sinaver.web3.data.Flow;
import ua.sinaver.web3.data.User;
import ua.sinaver.web3.data.Wallet;
import ua.sinaver.web3.message.FlowMessage;
import ua.sinaver.web3.message.WalletMessage;
import ua.sinaver.web3.repository.FlowRepository;
import ua.sinaver.web3.repository.UserRepository;
import ua.sinaver.web3.repository.AccountRepository;

@Slf4j
@Service
@Transactional
public class FlowService implements IFlowService {
    @Autowired
    private FlowRepository flowRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public void saveFlow(FlowMessage flowDto, User user) {
        val flow = convert(flowDto, user);
        flowRepository.save(flow);
        log.debug("Saved flow {}", flow);
    }

    @Override
    public List<FlowMessage> getAllFlows(User user) {
        val flows = flowRepository.findByUserId(user.getId());
        return flows.stream()
                .map(f -> convert(f, user))
                .toList();
    }

    @Override
    public FlowMessage findByUUID(String uuid) {
        val flow = flowRepository.findByUuid(uuid);
        if (flow != null) {
            Optional<User> user = userRepository.findById(flow.getUserId());
            if (user.isPresent()) {
                return convert(flow, user.get());
            }
        }
        return null;
    }

    @Override
    public void deleteFlowWallet(String uuid, WalletMessage walletDto, User user) throws Exception {
        val flow = flowRepository.findByUuid(uuid);
        if (flow == null) {
            throw new Exception("Flow doesn't exist");
        } else if (!flow.getUserId().equals(user.getId())) {
            throw new Exception("Authenticated user mismatch");
        }

        val network = walletDto.network();
        val address = walletDto.address();

        val walletOptional = flow.getWallets().stream()
                .filter(w -> w.getNetwork().equals(network) && w.getAddress().equals(address))
                .findFirst();
        if (!walletOptional.isPresent()) {
            return;
        }

        val wallet = walletOptional.get();
        // deleting smart wallets from flow doesn't make sense
        if (wallet.isSmart()) {
            throw new Exception("Not allowed!");
        }

        flow.getWallets().remove(wallet);

        log.info("Removed wallet {} from flow {}", wallet, flow);
    }

    @Override
    public void addFlowWallet(String uuid, WalletMessage walletDto, User user) throws Exception {
        val flow = flowRepository.findByUuid(uuid);
        if (flow == null) {
            throw new Exception("Flow doesn't exist");
        } else if (!flow.getUserId().equals(user.getId())) {
            throw new Exception("Authenticated user mismatch");
        }

        val wallet = convert(walletDto);
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

        log.info("Added wallet {} to flow {}", wallet, flow);

    }

    private static FlowMessage convert(Flow flow, User user) {
        val wallets = flow.getWallets().stream().map(w -> convert(w))
                .toList();
        return new FlowMessage(user.getSigner(), flow.getTitle(), flow.getDescription(), flow.getUuid(),
                wallets);
    }

    private static Flow convert(FlowMessage flowDto, User user) {
        val flow = new Flow(user.getId(), flowDto.title(), flowDto.description());
        val wallets = flowDto.wallets().stream().map(w -> {
            val wallet = convert(w);
            wallet.setFlow(flow);
            return wallet;
        }).toList();
        flow.setWallets(wallets);
        return flow;
    }

    private static Wallet convert(WalletMessage walletDto) {
        return new Wallet(walletDto.address(), walletDto.network(), walletDto.safe(), walletDto.smart());
    }

    private static WalletMessage convert(Wallet wallet) {
        return new WalletMessage(wallet.getAddress(), wallet.getNetwork(), wallet.isSmart(), wallet.isSafe(),
                wallet.isSmart() && wallet.getMaster() != null ? wallet.getMaster().getAddress() : null);
    }
}
